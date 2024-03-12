import datetime
import os
from typing import List
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from src.dataclasses.album import Album
from src.dataclasses.api_playback_info import ApiPlaybackInfo
from src.dataclasses.playback_info import PlaybackInfo, PlaylistProgression
from src.dataclasses.playlist_info import PlaylistInfo

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


class SpotifyClient:
    def __init__(self):
        client_id = os.getenv("SPOTIFY_CLIENT_ID")
        client_secret = os.getenv("SPOTIFY_SECRET")
        redirect_uri = os.getenv("SPOTIPY_REDIRECT_URI")

        self.client = spotipy.Spotify(
            auth_manager=SpotifyOAuth(
                scope=scope,
                client_id=client_id,
                client_secret=client_secret,
                redirect_uri=redirect_uri,
            )
        )

    def get_playlists(self, limit=10, offset=0):
        api_playlists = self.client.current_user_playlists(limit=limit, offset=offset)
        return api_playlists["items"]

    def get_playlist(self, id: str, fields=None):
        api_playlist = self.client.playlist(playlist_id=id, fields=fields)
        return api_playlist

    def create_playlist(self, name, description):
        description = None if description == "" else description
        user = self.client.me()

        return self.client.user_playlist_create(
            user=user["id"], name=name, description=description
        )

    def update_playlist(self, id: str, name, description):
        description = None if description == "" else description
        return self.client.playlist_change_details(
            playlist_id=id, name=name, description=description
        )

    def delete_playlist(self, id: str):
        user = self.client.me()

        return self.client.user_playlist_unfollow(user=user["id"], playlist_id=id)

    def get_playlist_tracks(self, id: str):
        playlist_tracks = []
        offset = 0
        limit = 100
        api_tracks_object = self.client.playlist_items(id, limit=limit, offset=offset)
        while True:
            playlist_tracks += api_tracks_object["items"]
            if not api_tracks_object["next"]:
                return playlist_tracks
            offset += limit
            api_tracks_object = self.client.playlist_items(id, limit=100, offset=offset)

    def get_my_current_playback(self) -> PlaybackInfo | None:
        api_playback = self.client.current_playback()

        if api_playback is None:
            return None
        context = api_playback["context"]
        if context["type"] == "playlist":
            playlist_id = context["uri"]
        album = self.client.album(api_playback["item"]["album"]["id"])
        album_duration = sum(
            [track["duration_ms"] for track in album["tracks"]["items"]]
        )
        album_progress = (
            sum(
                [
                    track["duration_ms"]
                    for track in album["tracks"]["items"][
                        0 : api_playback["item"]["track_number"] - 1
                    ]
                ]
            )
            + api_playback["progress_ms"]
        )
        return PlaybackInfo(
            api_playback["item"]["name"],
            api_playback["item"]["id"],
            api_playback["item"]["album"]["name"],
            playlist_id,
            [artist["name"] for artist in api_playback["item"]["artists"]],
            [artist["name"] for artist in api_playback["item"]["album"]["artists"]],
            api_playback["item"]["album"]["images"][0]["url"],
            api_playback["progress_ms"],
            api_playback["item"]["duration_ms"],
            album_progress,
            album_duration,
        )

    def get_playlist_progression(self, api_playback):
        playlist_tracks = self.get_playlist_tracks(api_playback["playlist_id"])
        playlist_info = self.get_playlist(api_playback["playlist_id"], fields="name")
        playlist_progress = get_playlist_progress(api_playback, playlist_tracks)
        playlist_duration = get_playlist_duration(playlist_tracks)
        return PlaylistProgression(
            api_playback["playlist_id"],
            playlist_info["name"],
            playlist_progress,
            playlist_duration,
        )

    def get_my_user_info(self):
        return self.client.current_user()

    def get_album_by_id(self, id):
        return self.client.album(id)

    def search_albums(self, search=None, offset=0) -> List[Album]:
        if search:
            api_results = self.client.search(
                q=search, type="album", limit=50, offset=offset
            )
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
            return [
                Album(
                    title=x["name"],
                    artists=[y["name"] for y in x["artists"]],
                    release_date=x["release_date"],
                    spotify_id=x["id"],
                )
                for x in self.client.new_releases(limit=50)["albums"]["items"]
                if x["album_type"] == "album"
            ]


def get_playlist_duration(playlist_info: PlaylistInfo) -> int:
    return sum(track["track"]["duration_ms"] for track in playlist_info)


def get_playlist_progress(api_playback, playlist_info) -> int:
    current_track_number = next(
        (
            i
            for i, obj in enumerate(playlist_info)
            if obj["track"]["id"] == api_playback["track_id"]
        ),
        None,
    )
    return (
        sum(
            [
                track["track"]["duration_ms"]
                for track in playlist_info[0:current_track_number]
            ]
        )
        + api_playback["track_progress"]
    )
