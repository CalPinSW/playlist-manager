import json
import requests
import os
from typing import Callable, List
from flask import make_response, redirect
from src.dataclasses.album import Album
from src.dataclasses.playback_info import PlaybackInfo, PlaylistProgression
from src.dataclasses.playback_state import PlaybackState
from src.dataclasses.playlist import Playlist
from src.dataclasses.playlist_info import CurrentUserPlaylists, SimplifiedPlaylist
from urllib.parse import urlencode

from src.dataclasses.playlist_tracks import PlaylistTrackObject, PlaylistTracks
from src.dataclasses.user import User
from src.exceptions.Unauthorized import UnauthorizedException

scope = [
    "user-library-read",
    "user-read-currently-playing",
    "user-read-playback-state",
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
]


class BearerAuth(requests.auth.AuthBase):
    def __init__(self, token):
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
        access_token = self.response_handler(response)["access_token"]
        user_info = self.get_current_user(access_token)

        resp = make_response(redirect("http://localhost:1234/"))
        resp.set_cookie("spotify_access_token", access_token)
        resp.set_cookie("user_id", user_info.id)
        return resp

    def get_playlists(self, user_id, access_token, limit=10, offset=0):
        response = requests.get(
            url=f"https://api.spotify.com/v1/users/{user_id}/playlists",
            params={
                "limit": limit,
                "offset": offset,
            },
            auth=BearerAuth(access_token),
        )
        api_playlists = self.response_handler(response)
        playlists = CurrentUserPlaylists.model_validate(api_playlists)
        return playlists.items

    def get_current_user(self, access_token):
        response = requests.get(
            url="https://api.spotify.com/v1/me",
            auth=BearerAuth(access_token),
        )
        api_current_user = self.response_handler(response)
        current_user = User.model_validate(api_current_user)
        return current_user

    def get_playlist(self, access_token, id: str, fields=None):
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
        playlist = Playlist.model_validate(api_playlist)
        return playlist

    def create_playlist(self, user_id, access_token, name, description):
        description = None if description == "" else description
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
        self, access_token, id: str, name, description
    ):  # ToDo: Figure out how to set description to empty string
        response = requests.put(
            url=f"https://api.spotify.com/v1/playlists/{id}",
            data=json.dumps({"name": name, "description": description, "public": True}),
            headers={
                "Content-Type": "application/json",
            },
            auth=BearerAuth(access_token),
        )
        api_playlist = self.response_handler(response)
        playlist = Playlist.model_validate(api_playlist)
        return playlist

    def delete_playlist(self, access_token, id: str):
        response = requests.delete(
            url=f"https://api.spotify.com/v1/playlists/{id}/followers",
            auth=BearerAuth(access_token),
        )
        return self.response_handler(response, jsonify=False)

    def get_playlist_items(self, access_token, id, limit, offset):
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

    def get_playlist_tracks(self, access_token, id: str):
        playlist_tracks: List[PlaylistTrackObject] = []
        offset = 0
        limit = 100
        api_tracks_object = self.get_playlist_items(
            access_token=access_token, id=id, limit=limit, offset=offset
        )
        while True:
            playlist_tracks += api_tracks_object.items
            if not api_tracks_object.next:
                return playlist_tracks
            offset += limit
            api_tracks_object = self.get_playlist_items(
                access_token, id, limit=100, offset=offset
            )

    def get_album(self, access_token, id):
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

    def get_current_playback(self, access_token):
        response = requests.get(
            f"https://api.spotify.com/v1/me/player",
            auth=BearerAuth(access_token),
        )
        api_current_playback = self.response_handler(response)
        current_playback = (
            PlaybackState.model_validate(api_current_playback)
            if api_current_playback
            else None
        )
        return current_playback

    def get_my_current_playback(self, access_token) -> PlaybackInfo | None:
        api_playback = self.get_current_playback(access_token=access_token)

        if api_playback is None:
            return None
        context = api_playback.context
        if context.type == "playlist":
            playlist_id = context.uri.replace("spotify:playlist:", "")
        else:
            playlist_id = None
        album = self.get_album(access_token=access_token, id=api_playback.item.album.id)
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
            }
        )

    def get_playlist_progression(self, access_token, api_playback: PlaybackInfo):
        playlist_tracks = self.get_playlist_tracks(
            access_token=access_token, id=api_playback.playlist_id
        )
        playlist_info = self.get_playlist(
            access_token=access_token, id=api_playback.playlist_id
        )
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

    def search_albums(self, access_token, search=None, offset=0) -> List[Album]:
        if search:
            response = requests.get(
                f"https://api.spotify.com/v1/albums/{id}",
                data={"q": search, "type": "album", "limit": 50, "offset": offset},
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
