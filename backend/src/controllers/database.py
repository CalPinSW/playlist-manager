from flask import Blueprint, make_response, request

from src.database.crud.album import (
    add_genres_to_album,
    get_album_artists,
    get_album_genres,
    get_user_albums,
    update_album,
)
from src.database.crud.genre import create_genre
from src.database.crud.playlist import (
    create_playlist,
    get_playlist_albums,
    get_playlist_by_id_or_none,
    get_user_playlists,
    update_playlist_with_albums,
)
from src.database.crud.user import get_or_create_user
from src.musicbrainz import MusicbrainzClient
from src.spotify import SpotifyClient
from time import sleep


def database_controller(spotify: SpotifyClient, musicbrainz: MusicbrainzClient):
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
        (db_user,) = get_or_create_user(user)

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
                    create_playlist(playlist, albums, db_user)
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
                        update_playlist_with_albums(playlist, albums)

        return make_response("Playlist data populated", 201)

    @database_controller.route(
        "populate_additional_album_details_from_playlist", methods=["GET"]
    )
    def populate_additional_album_details_from_playlist():
        access_token = request.cookies.get("spotify_access_token")
        user = spotify.get_current_user(access_token)
        playlists = get_user_playlists(user.id)

        for playlist in playlists:
            albums = get_playlist_albums(playlist.id)
            if albums == []:
                continue
            batch_albums = split_list(albums, 20)
            for album_chunk in batch_albums:
                sleep(0.5)
                albums = spotify.get_multiple_albums(
                    access_token=access_token, ids=[album.id for album in album_chunk]
                )
                for db_album in albums:
                    album = spotify.get_album(access_token=access_token, id=db_album.id)
                    update_album(album)

        return make_response("Playlist data populated", 201)

    @database_controller.route("populate_additional_album_details", methods=["GET"])
    def populate_additional_album_details():
        access_token = request.cookies.get("spotify_access_token")
        user = spotify.get_current_user(access_token)
        albums = get_user_albums(user.id)
        albums_without_label = [album for album in albums]  # if album.label is None]
        if albums_without_label == []:
            return make_response("No Albums to process", 204)
        batch_albums = split_list(albums_without_label, 20)
        for album_chunk in batch_albums:
            sleep(0.5)
            albums = spotify.get_multiple_albums(
                access_token=access_token, ids=[album.id for album in album_chunk]
            )
            for db_album in albums:
                db_album.genres = musicbrainz.get_album_genres(
                    db_album.artists[0].name, db_album.name
                )
                update_album(db_album)

        return make_response("Playlist details populated", 201)

    @database_controller.route("populate_universal_genre_list", methods=["GET"])
    def populate_universal_genre_list():
        genre_list = musicbrainz.get_genre_list()
        [create_genre(genre) for genre in genre_list]
        return make_response("Genre data populated", 201)

    @database_controller.route("populate_user_album_genres", methods=["GET"])
    def populate_user_album_genres():
        access_token = request.cookies.get("spotify_access_token")
        user = spotify.get_current_user(access_token)
        populate_album_genres_by_user_id(user.id, musicbrainz)
        return make_response("User album genres populated", 201)

    return database_controller


def split_list(input_list, max_length=20):
    return [
        input_list[i : i + max_length] for i in range(0, len(input_list), max_length)
    ]


def populate_album_genres_by_user_id(
    user_id: str, musicbrainz: MusicbrainzClient = MusicbrainzClient()
):
    albums = get_user_albums(user_id=user_id)
    print(f"processing album {0} of {len(albums)}")
    skip_count = 0
    for idx, db_album in enumerate(albums):
        print("\033[A                             \033[A")
        print(f"processing album {idx} of {len(albums)}, skipped {skip_count}")
        if get_album_genres(db_album.id) != []:
            skip_count += 1
            continue
        album_artists = get_album_artists(db_album)
        genres = musicbrainz.get_album_genres(
            artist_name=album_artists[0].name, album_title=db_album.name
        )
        add_genres_to_album(db_album, genres)
    print("\033[A                             \033[A")
    print(f"completed. Processed {len(albums)} albums. Skipped ")
