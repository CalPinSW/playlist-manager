from logging import Logger
from flask import Blueprint, Flask, make_response, request

from src.database.crud.album import (
    add_genres_to_album,
    get_album_artists,
    get_album_genres,
    get_user_albums,
    get_user_albums_with_no_artists,
    update_album,
)
from src.database.crud.genre import create_genre
from src.database.crud.playlist import (
    create_playlist,
    delete_playlist,
    get_playlist_albums,
    get_playlist_by_id_or_none,
)
from src.database.crud.user import get_or_create_user
from src.musicbrainz import MusicbrainzClient
from src.spotify import SpotifyClient
from playhouse.flask_utils import FlaskDB


def database_controller(
    spotify: SpotifyClient,
    musicbrainz: MusicbrainzClient,
    database: FlaskDB,
    logger: Logger,
):
    database_controller = Blueprint(
        name="database_controller", import_name=__name__, url_prefix="/database"
    )

    @database_controller.route("populate_user", methods=["GET"])
    def populate_user():
        user_id = request.cookies.get("user_id")
        user = spotify.get_user_by_id(user_id=user_id)
        (db_user, _) = get_or_create_user(user)
        simplified_playlists = spotify.get_all_playlists(user_id=user.id)
        number_of_playlists_updated = 0
        logger.info("Populating user playlists for user_id: %s", user_id)
        try:
            for simplified_playlist in simplified_playlists:
                with database.database.atomic():
                    if "Albums" in simplified_playlist.name:
                        db_playlist = get_playlist_by_id_or_none(simplified_playlist.id)
                        if (
                            db_playlist is None
                            or db_playlist.snapshot_id
                            != simplified_playlist.snapshot_id
                        ):
                            number_of_playlists_updated += 1
                            if db_playlist is not None:
                                delete_playlist(db_playlist.id)
                            playlist = spotify.get_playlist(
                                user_id=user.id,
                                id=simplified_playlist.id,
                            )
                            create_playlist(playlist, db_user)

            logger.info(
                f"Completed populating user playlists for user_id: {user_id}. {number_of_playlists_updated} albums updated",
            )

            return make_response(
                f"Playlist data populated/updated for {number_of_playlists_updated} playlists.",
                201,
            )
        except:
            logger.info(
                f"Error populating user playlists for user_id: {user_id}.",
                user_id,
            )

    @database_controller.route("populate_playlist/<id>", methods=["GET"])
    def populate_playlist(id):
        user_id = request.cookies.get("user_id")
        logger.info(
            f"Populating playlist_id ${id} for user_id {user_id}.",
        )
        try:
            user = spotify.get_user_by_id(user_id=user_id)
            (db_user, _) = get_or_create_user(user)
            db_playlist = get_playlist_by_id_or_none(id)
            if db_playlist is not None:
                delete_playlist(db_playlist.id)
            playlist = spotify.get_playlist(user_id=user.id, id=id)
            create_playlist(playlist, db_user)
            albums = get_playlist_albums(playlist.id)
            batch_albums = split_list(albums, 20)
            for album_chunk in batch_albums:
                albums = spotify.get_multiple_albums(
                    user_id=user_id, ids=[album.id for album in album_chunk]
                )
                for db_album in albums:
                    with database.database.atomic():
                        db_album.genres = musicbrainz.get_album_genres(
                            db_album.artists[0].name, db_album.name
                        )
                        update_album(db_album)

            logger.info(
                f"Completed populating playlist_id ${id} for user_id {user_id}.",
            )
            return make_response("Playlist details populated", 201)
        except:
            logger.error(
                f"Error populating playlist_id ${id} for user_id {user_id}.",
            )

    @database_controller.route("populate_additional_album_details", methods=["GET"])
    def populate_additional_album_details():
        user_id = request.cookies.get("user_id")
        logger.info(
            f"Populating additional album details for user_id {user_id}.",
        )
        try:
            albums = get_user_albums_with_no_artists(user_id=user_id)
            batch_albums = split_list(albums, 20)
            for album_chunk in batch_albums:
                albums = spotify.get_multiple_albums(
                    user_id=user_id, ids=[album.id for album in album_chunk]
                )
                for db_album in albums:
                    with database.database.atomic():
                        db_album.genres = musicbrainz.get_album_genres(
                            db_album.artists[0].name, db_album.name
                        )
                        update_album(db_album)
            logger.info(
                f"Completed populating additional album details for user_id {user_id}.",
            )

            return make_response("Playlist details populated", 201)
        except:
            logger.error(
                f"Error populating additional album details for user_id {user_id}.",
            )

    @database_controller.route("populate_universal_genre_list", methods=["GET"])
    def populate_universal_genre_list():
        genre_list = musicbrainz.get_genre_list()
        [create_genre(genre) for genre in genre_list]
        return make_response("Genre data populated", 201)

    @database_controller.route("populate_user_album_genres", methods=["GET"])
    def populate_user_album_genres():
        user_id = request.cookies.get("user_id")
        user = spotify.get_user_by_id(user_id=user_id)
        populate_album_genres_by_user_id(user.id, musicbrainz)
        return make_response("User album genres populated", 201)

    def populate_album_genres_by_user_id(
        user_id: str, musicbrainz: MusicbrainzClient = MusicbrainzClient(logger=logger)
    ):
        albums = get_user_albums(user_id=user_id)
        logger.info(f"processing album {0} of {len(albums)}")
        skip_count = 0
        for idx, db_album in enumerate(albums):
            logger.info("\033[A                             \033[A")
            logger.info(
                f"processing album {idx} of {len(albums)}, skipped {skip_count}"
            )
            if get_album_genres(db_album.id) != []:
                skip_count += 1
                continue
            album_artists = get_album_artists(db_album)
            genres = musicbrainz.get_album_genres(
                artist_name=album_artists[0].name, album_title=db_album.name
            )
            add_genres_to_album(db_album, genres)
        logger.info("\033[A                             \033[A")
        logger.info(f"completed. Processed {len(albums)} albums. Skipped ")

    return database_controller


def split_list(input_list, max_length=20):
    return [
        input_list[i : i + max_length] for i in range(0, len(input_list), max_length)
    ]
