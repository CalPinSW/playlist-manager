import os
from typing import List
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from src.album import Album

from src.text_formatting import format_ms_as_mins_and_secs

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


class PlaybackInfo:
    def __init__(
        self,
        track_title,
        album_title,
        track_artists,
        album_artists,
        artwork_url,
        track_progress,
        track_duration,
        album_progress,
        album_duration,
    ):
        self.track_title = track_title
        self.album_title = album_title
        self.track_artists = track_artists
        self.album_artists = album_artists
        self.artwork_url = artwork_url
        self.track_progress = track_progress
        self.track_duration = track_duration
        self.album_progress = album_progress
        self.album_duration = album_duration

    def get_formatted_artists(self):
        return ", ".join(self.track_artists)

    def get_formatted_track_progress(self):
        return (
            format_ms_as_mins_and_secs(self.track_progress)
            + " / "
            + format_ms_as_mins_and_secs(self.track_duration)
        )

    def get_formatted_album_progress(self):
        return (
            format_ms_as_mins_and_secs(self.album_progress)
            + " / "
            + format_ms_as_mins_and_secs(self.album_duration)
            + f" ({(100*self.album_progress/self.album_duration):02.0f}%)"
        )


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

    def get_playlists(self):
        api_playlists = self.client.current_user_playlists()
        return api_playlists["items"]

    def get_playlist(self, id: str):
        api_playlist = self.client.playlist(playlist_id=id)
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

    def get_my_current_playback(self) -> PlaybackInfo:
        api_playback = self.client.current_playback()
        album = self.client.album(api_playback["item"]["album"]["id"])
        album_duration = sum(
            [track["duration_ms"] for track in album["tracks"]["items"]]
        )
        album_progress = (
            sum(
                [
                    track["duration_ms"]
                    for track in album["tracks"]["items"][
                        0 : api_playback["item"]["track_number"]
                    ]
                ]
            )
            + api_playback["progress_ms"]
        )
        return PlaybackInfo(
            api_playback["item"]["name"],
            api_playback["item"]["album"]["name"],
            [artist["name"] for artist in api_playback["item"]["artists"]],
            [artist["name"] for artist in api_playback["item"]["album"]["artists"]],
            api_playback["item"]["album"]["images"][0]["url"],
            api_playback["progress_ms"],
            api_playback["item"]["duration_ms"],
            album_progress,
            album_duration,
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
