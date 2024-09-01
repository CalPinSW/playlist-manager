from logging import Logger
from flask import Blueprint, make_response, request

from src.database.crud.playlist import (
    create_playlist,
    get_playlist_by_id_or_none,
    update_playlist,
)
from src.database.crud.user import get_or_create_user
from src.spotify import SpotifyClient


def database_controller(spotify: SpotifyClient):
    database_controller = Blueprint(
        name="database_controller", import_name=__name__, url_prefix="/database"
    )

    @database_controller.route("populate_user", methods=["GET"])
    def populate_user():
        access_token = request.cookies.get("spotify_access_token")
        user = spotify.get_current_user(access_token)
        simplified_playlists = spotify.get_all_playlists(
            user_id=user.id, access_token=access_token
        )
        get_or_create_user(user)

        for simplified_playlist in simplified_playlists:
            if "Albums" in simplified_playlist.name:
                db_playlist = get_playlist_by_id_or_none(simplified_playlist.id)

                if db_playlist is None:
                    [playlist, albums] = [
                        spotify.get_playlist(
                            access_token=access_token, id=simplified_playlist.id
                        ),
                        spotify.get_playlist_album_info(
                            access_token=access_token, id=simplified_playlist.id
                        ),
                    ]
                    create_playlist(playlist, albums)
                else:
                    if db_playlist.snapshot_id != simplified_playlist.snapshot_id:
                        [playlist, albums] = [
                            spotify.get_playlist(
                                access_token=access_token, id=simplified_playlist.id
                            ),
                            spotify.get_playlist_album_info(
                                access_token=access_token, id=simplified_playlist.id
                            ),
                        ]
                        update_playlist(playlist, albums)

        return make_response("Playlist data populated", 201)

    return database_controller
