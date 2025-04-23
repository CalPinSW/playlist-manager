import json
from time import sleep
import requests
import os
import urllib.parse
from tenacity import RetryError, Retrying, stop_after_attempt, wait_fixed
from typing import List, Optional
from flask import Response, make_response, redirect
from src.database.crud.album import get_album_genres
from src.database.crud.user import get_user_tokens, upsert_user_tokens
from src.dataclasses.album import Album
from src.dataclasses.playback_info import PlaybackInfo, PlaylistProgression
from src.dataclasses.playback_request import (
    StartPlaybackRequest,
    StartPlaybackRequestUriOffset,
)
from src.dataclasses.playback_state import PlaybackState
from src.dataclasses.playlist import Playlist
from src.dataclasses.playlist_info import CurrentUserPlaylists, SimplifiedPlaylist
from urllib.parse import urlencode

from src.dataclasses.playlist_tracks import PlaylistTrackObject, PlaylistTracks
from src.dataclasses.spotify_auth.token_response import TokenResponse
from src.dataclasses.user import User
from src.exceptions.Unauthorized import UnauthorizedException
from src.flask_config import Config
from src.utils.response_creator import add_cookies_to_response

scope = [
    "user-library-read",
    "user-library-modify",
    "user-read-currently-playing",
    "user-read-playback-state",
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-modify-playback-state",
]


class BearerAuth(requests.auth.AuthBase):
    def __init__(self, token):
        if token is None:
            raise UnauthorizedException
        self.token = token

    def __call__(self, r):
        r.headers["authorization"] = "Bearer " + self.token
        return r


class SpotifyClient:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_SECRET")
        self.redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")
        self.scope = scope

    def response_handler(self, response: requests.Response, jsonify=True):
        if response.status_code == 401:
            raise UnauthorizedException
        else:
            if jsonify:
                if response.status_code == 204:
                    return None
                else:
                    return response.json()
            else:
                return response

    def get_login_query_string(self, state):
        return urlencode(
            {
                "response_type": "code",
                "client_id": self.client_id,
                "scope": " ".join(self.scope),
                "redirect_uri": self.redirect_uri,
                "state": state,
            }
        )

    def refresh_access_token(self, user_id):
        refresh_token = get_user_tokens(user_id).refresh_token
        if not refresh_token:
            raise UnauthorizedException
        response = requests.post(
            url="https://accounts.spotify.com/api/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            headers={
                "content-type": "application/x-www-form-urlencoded",
            },
            auth=(self.client_id, self.client_secret),
        )
        if response.status_code == 400:
            raise UnauthorizedException

        api_response = self.response_handler(response)
        token_response = TokenResponse.model_validate(api_response)
        access_token = token_response.access_token
        refresh_token = (
            refresh_token
            if token_response.refresh_token is None
            else token_response.refresh_token
        )
        upsert_user_tokens(
            user_id=user_id,
            access_token=token_response.access_token,
            refresh_token=refresh_token,
        )
        return (user_id, access_token, refresh_token)

    def request_access_token(self, code):
        response = requests.post(
            url="https://accounts.spotify.com/api/token",
            data={
                "code": code,
                "redirect_uri": self.redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={
                "content-type": "application/x-www-form-urlencoded",
            },
            auth=(self.client_id, self.client_secret),
        )
        api_response = self.response_handler(response)
        token_response = TokenResponse.model_validate(api_response)
        user_info = self.get_current_user(token_response.access_token)
        upsert_user_tokens(
            user_info.id,
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
        )
        resp = add_cookies_to_response(
            make_response(redirect(f"{Config().FRONTEND_URL}/")),
            {
                "user_id": user_info.id,
            },
        )
        return resp

    def get_playlists(self, user_id, limit=10, offset=0) -> CurrentUserPlaylists:
        try:
            for attempt in Retrying(
                wait=wait_fixed(2),
                after=self.refresh_user_access_tokens(user_id=user_id),
            ):
                with attempt:
                    access_token = get_user_tokens(user_id=user_id).access_token
                    response = requests.get(
                        url=f"https://api.spotify.com/v1/users/{user_id}/playlists",
                        params={
                            "limit": limit,
                            "offset": offset,
                        },
                        auth=BearerAuth(access_token),
                    )
                    api_playlists = self.response_handler(response)
        except RetryError:
            pass
        playlists = CurrentUserPlaylists.model_validate(api_playlists)
        return playlists

    def get_all_playlists(self, user_id) -> List[SimplifiedPlaylist]:
        playlists: List[SimplifiedPlaylist] = []
        offset = 0
        limit = 50
        api_playlists = self.get_playlists(user_id=user_id, limit=limit, offset=offset)
        while True:
            playlists += api_playlists.items
            if not api_playlists.next:
                return playlists
            offset += limit
            api_playlists = self.get_playlists(
                user_id=user_id, limit=limit, offset=offset
            )

    def find_associated_playlists(self, user_id, playlist_id: str):
        [playlist_name, user_playlists] = [
            self.get_playlist(id=playlist_id, user_id=user_id).name,
            self.get_all_playlists(user_id=user_id),
        ]
        associated_playlists = [
            matchingPlaylist
            for matchingPlaylist in user_playlists
            if matchingPlaylist.name[-8:] == playlist_name[-8:]
            and matchingPlaylist.name != playlist_name
        ]
        return associated_playlists

    def get_user_by_id(self, user_id):
        try:
            for attempt in Retrying(
                wait=wait_fixed(1),
                after=self.refresh_user_access_tokens(user_id=user_id),
                stop=stop_after_attempt(2),
            ):
                access_token = get_user_tokens(user_id=user_id).access_token
                with attempt:
                    response = requests.get(
                        url="https://api.spotify.com/v1/me",
                        auth=BearerAuth(access_token),
                    )
                    api_current_user = self.response_handler(response)
                    current_user = User.model_validate(api_current_user)
        except RetryError:
            pass
        return current_user

    def get_current_user(self, access_token):
        response = requests.get(
            url="https://api.spotify.com/v1/me",
            auth=BearerAuth(access_token),
        )
        api_current_user = self.response_handler(response)
        current_user = User.model_validate(api_current_user)
        return current_user

    def get_playlist(self, user_id, id: str, fields=None):
        try:
            for attempt in Retrying(
                wait=wait_fixed(2),
                after=self.refresh_user_access_tokens(user_id=user_id),
            ):
                with attempt:
                    access_token = get_user_tokens(user_id=user_id).access_token
                    response = requests.get(
                        url=f"https://api.spotify.com/v1/playlists/{id}",
                        params={
                            "playlist_id": id,
                            "fields": fields,
                        },
                        headers={
                            "content-type": "application/json",
                        },
                        auth=BearerAuth(access_token),
                    )
                    api_playlist = self.response_handler(response)
        except RetryError:
            pass
        playlist = Playlist.model_validate(api_playlist)
        if playlist.tracks.next:
            playlist.tracks.items = self.get_playlist_tracks(
                user_id=user_id, id=playlist.id
            )
        return playlist

    def create_playlist(self, user_id, name, description):
        description = None if description == "" else description
        access_token = get_user_tokens(user_id=user_id).access_token
        response = requests.post(
            url=f"https://api.spotify.com/v1/users/{user_id}/playlists",
            data=json.dumps(
                {
                    "name": name,
                    "description": description,
                }
            ),
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        return self.response_handler(response, jsonify=False)

    def update_playlist(
        self, user_id: str, id: str, name, description
    ):  # ToDo: Figure out how to set description to empty string
        access_token = get_user_tokens(user_id=user_id).access_token
        response = requests.put(
            url=f"https://api.spotify.com/v1/playlists/{id}",
            data=json.dumps({"name": name, "description": description, "public": True}),
            headers={
                "Content-Type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        return self.response_handler(response, jsonify=False)

    def delete_playlist(self, user_id, id: str):
        access_token = get_user_tokens(user_id=user_id).access_token
        response = requests.delete(
            url=f"https://api.spotify.com/v1/playlists/{id}/followers",
            auth=BearerAuth(access_token),
        )
        return self.response_handler(response, jsonify=False)

    def get_playlist_items(self, user_id, id, limit, offset):
        access_token = get_user_tokens(user_id=user_id).access_token
        response = requests.get(
            url=f"https://api.spotify.com/v1/playlists/{id}/tracks",
            params={
                "limit": limit,
                "offset": offset,
            },
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        api_playlist_tracks = self.response_handler(response)
        playlist_tracks = PlaylistTracks.model_validate(api_playlist_tracks)
        return playlist_tracks

    def get_playlist_album_info(self, user_id, id) -> List[Album]:
        playlist_tracks = self.get_playlist_tracks(user_id=user_id, id=id)
        playlist_albums: List[Album] = []
        for track in playlist_tracks:
            if track.track.album not in playlist_albums:
                playlist_albums.append(track.track.album)
        for album in playlist_albums:
            album.genres = [genre.name for genre in get_album_genres(album.id)]
        return playlist_albums

    def get_playlist_tracks(self, user_id, id: str):
        playlist_tracks: List[PlaylistTrackObject] = []
        offset = 0
        limit = 100
        api_tracks_object = self.get_playlist_items(
            user_id=user_id, id=id, limit=limit, offset=offset
        )
        while True:
            sleep(0.5)
            playlist_tracks += api_tracks_object.items
            if not api_tracks_object.next:
                return playlist_tracks
            offset += limit
            api_tracks_object = self.get_playlist_items(
                user_id=user_id, id=id, limit=limit, offset=offset
            )

    def get_album(self, user_id, id):
        access_token = get_user_tokens(user_id=user_id).access_token
        response = requests.get(
            f"https://api.spotify.com/v1/albums/{id}",
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        api_album = self.response_handler(response)
        album = Album.model_validate(api_album)
        return album

    def get_multiple_albums(self, user_id, ids: List[str]) -> List[Album]:
        access_token = get_user_tokens(user_id=user_id).access_token
        encoded_ids = urllib.parse.quote_plus(",".join(ids))
        response = requests.get(
            f"https://api.spotify.com/v1/albums?ids={encoded_ids}",
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        api_albums = self.response_handler(response)
        albums = [Album.model_validate(api_album) for api_album in api_albums["albums"]]
        return albums

    def get_current_playback(self, user_id) -> PlaybackState | None:
        if user_id is None:
            return None
        try:
            for attempt in Retrying(
                wait=wait_fixed(2),
                after=self.refresh_user_access_tokens(user_id=user_id),
            ):
                with attempt:
                    user_tokens = get_user_tokens(user_id=user_id)
                    if user_tokens is None:
                        raise Exception("User tokens not found")
                    access_token = user_tokens.access_token
                    response = requests.get(
                        "https://api.spotify.com/v1/me/player",
                        auth=BearerAuth(access_token),
                    )
                    api_current_playback = self.response_handler(response)
        except RetryError:
            pass

        current_playback = (
            PlaybackState.model_validate(api_current_playback)
            if api_current_playback
            else None
        )
        return current_playback

    def get_my_current_playback(self, user_id) -> PlaybackInfo | None:
        api_playback = self.get_current_playback(user_id=user_id)

        if api_playback is None:
            return None
        context = api_playback.context
        if context.type == "playlist":
            playlist_id = context.uri.replace("spotify:playlist:", "")
        else:
            playlist_id = None
        album = self.get_album(user_id=user_id, id=api_playback.item.album.id)
        album_duration = sum([track.duration_ms for track in album.tracks.items])
        album_progress = (
            sum(
                [
                    track.duration_ms
                    for track in album.tracks.items[
                        0 : api_playback.item.track_number - 1
                    ]
                ]
            )
            + api_playback.progress_ms
        )
        return PlaybackInfo.model_validate(
            {
                "track_title": api_playback.item.name,
                "track_id": api_playback.item.id,
                "album_title": api_playback.item.album.name,
                "album_id": api_playback.item.album.id,
                "playlist_id": playlist_id,
                "track_artists": [artist.name for artist in api_playback.item.artists],
                "album_artists": [
                    artist.name for artist in api_playback.item.album.artists
                ],
                "artwork_url": api_playback.item.album.images[0].url,
                "track_progress": api_playback.progress_ms,
                "track_duration": api_playback.item.duration_ms,
                "album_progress": album_progress,
                "album_duration": album_duration,
                "is_playing": api_playback.is_playing,
            }
        )

    def get_playlist_progression(self, user_id, api_playback: PlaybackInfo):
        playlist_tracks = self.get_playlist_tracks(
            user_id=user_id, id=api_playback.playlist_id
        )
        playlist_info = self.get_playlist(user_id=user_id, id=api_playback.playlist_id)
        playlist_progress = get_playlist_progress(api_playback, playlist_tracks)
        playlist_duration = get_playlist_duration(playlist_tracks)
        return PlaylistProgression.model_validate(
            {
                "playlist_id": api_playback.playlist_id,
                "playlist_title": playlist_info.name,
                "playlist_progress": playlist_progress,
                "playlist_duration": playlist_duration,
            }
        )

    def search_albums(self, user_id, search=None, offset=0, limit=50) -> List[Album]:
        access_token = get_user_tokens(user_id=user_id).access_token

        if search:
            response = requests.get(
                f"https://api.spotify.com/v1/albums/{id}",
                data={"q": search, "type": "album", "limit": limit, "offset": offset},
                headers={
                    "content-type": "application/json",
                },
                auth=BearerAuth(access_token),
            )
            api_results = self.response_handler(response)
            return [
                Album(
                    title=x["name"],
                    artists=[y["name"] for y in x["artists"]],
                    release_date=x["release_date"],
                    spotify_id=x["id"],
                )
                for x in api_results["albums"]["items"]
                if x["album_type"] == "album"
            ]
        else:
            new_releases = requests.get(
                "https://api.spotify.com/v1/browse/new-releases",
                data={"limit": limit, "offset": offset},
                headers={
                    "content-type": "application/json",
                },
                auth=BearerAuth(access_token),
            )
            return [
                Album(
                    title=x["name"],
                    artists=[y["name"] for y in x["artists"]],
                    release_date=x["release_date"],
                    spotify_id=x["id"],
                )
                for x in new_releases["albums"]["items"]
                if x["album_type"] == "album"
            ]

    def save_albums_to_library(self, user_id, album_ids: List[str]) -> Response:
        access_token = get_user_tokens(user_id=user_id).access_token

        response = requests.put(
            url="https://api.spotify.com/v1/me/albums",
            data=json.dumps(
                {
                    "ids": album_ids,
                }
            ),
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        return self.response_handler(response, jsonify=False)

    def add_album_to_playlist(self, user_id, playlist_id, album_id) -> Response:
        access_token = get_user_tokens(user_id=user_id).access_token
        album = self.get_album(user_id=user_id, id=album_id)
        self.save_albums_to_library(user_id=user_id, album_ids=[album.id])
        track_uris = [item.uri for item in album.tracks.items]
        if self.is_album_in_playlist(
            user_id=user_id, album=album, playlist_id=playlist_id
        ):
            return make_response("Album already present in playlist", 403)
        response = requests.post(
            url=f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
            data=json.dumps(
                {
                    "uris": track_uris,
                }
            ),
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        self.response_handler(response, jsonify=False)
        if response.status_code == 201:
            return make_response("Album successfully added to playlist", 201)
        else:
            return make_response("Failed to add album to playlist", 400)

    def is_album_in_playlist(self, user_id, playlist_id, album: Album) -> bool:
        playlist_tracks = self.get_playlist_tracks(user_id=user_id, id=playlist_id)
        playlist_track_ids = [track.track.id for track in playlist_tracks]
        album_track_ids = [track.id for track in album.tracks.items]
        return all(e in playlist_track_ids for e in album_track_ids)

    def pause_playback(self, user_id) -> Response:
        access_token = get_user_tokens(user_id=user_id).access_token
        response = requests.put(
            url="https://api.spotify.com/v1/me/player/pause",
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        return self.response_handler(
            make_response("", response.status_code), jsonify=False
        )

    def start_playback(
        self,
        user_id,
        start_playback_request_body: Optional[StartPlaybackRequest] = None,
    ) -> Response:
        access_token = get_user_tokens(user_id=user_id).access_token

        if not start_playback_request_body:
            data = None
        else:
            if start_playback_request_body.offset.album_id:
                track_offset = StartPlaybackRequestUriOffset.model_validate(
                    {
                        "uri": (
                            self.get_album(
                                user_id=user_id,
                                id=start_playback_request_body.offset.album_id,
                            )
                            .tracks.items[0]
                            .uri
                        )
                    }
                )

                start_playback_request_body.offset = track_offset
            data = start_playback_request_body.model_dump_json(exclude_none=True)

        response = requests.put(
            url="https://api.spotify.com/v1/me/player/play",
            data=data,
            headers={
                "content-type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        return self.response_handler(
            make_response("", response.status_code), jsonify=False
        )

    def pause_or_start_playback(self, user_id) -> Response:
        playback = self.get_current_playback(user_id=user_id)
        if playback and playback.is_playing:
            return self.pause_playback(user_id=user_id)
        else:
            return self.start_playback(user_id=user_id)

    def refresh_user_access_tokens(self, user_id):
        if not user_id:
            raise UnauthorizedException
        self.refresh_access_token(user_id=user_id)


def get_playlist_duration(playlist_info: List[PlaylistTrackObject]) -> int:
    return sum(track.track.duration_ms for track in playlist_info)


def get_playlist_progress(
    api_playback: PlaybackInfo, playlist_info: List[PlaylistTrackObject]
) -> int:
    current_track_number = next(
        (
            i
            for i, obj in enumerate(playlist_info)
            if obj.track.id == api_playback.track_id
        ),
        None,
    )
    return (
        sum(
            [track.track.duration_ms for track in playlist_info[0:current_track_number]]
        )
        + api_playback.track_progress
    )
