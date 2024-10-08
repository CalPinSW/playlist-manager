from flask import Blueprint, jsonify, make_response, request
from src.database.crud.playlist import (
    get_playlist_albums_with_genres,
    get_playlist_by_id_or_none,
    get_playlist_duration,
    get_playlist_duration_up_to_track,
    get_playlist_track_list,
    get_recent_user_playlists,
    get_user_playlists,
    search_playlist_names,
    update_playlist_info,
)
from src.dataclasses.playlist import Playlist
from src.spotify import SpotifyClient


def music_controller(spotify: SpotifyClient):
    music_controller = Blueprint(
        name="music_controller", import_name=__name__, url_prefix="/music"
    )

    @music_controller.route("playlists")
    def index():
        user_id = request.cookies.get("user_id")
        limit = request.args.get("limit", type=int)
        offset = request.args.get("offset", type=int)
        search = request.args.get("search")
        sort_by = request.args.get("sort_by")
        desc = request.args.get("desc") == "True"
        return jsonify(
            get_user_playlists(
                user_id=user_id,
                limit=limit,
                offset=offset,
                search=search,
                sort_by=sort_by,
                desc=desc,
                as_dicts=True,
            )
        )

    @music_controller.route("playlists/recent")
    def recent_playlists():
        user_id = request.cookies.get("user_id")
        limit = request.args.get("limit", type=int)
        offset = request.args.get("offset", type=int)
        search = request.args.get("search")

        return jsonify(
            get_recent_user_playlists(
                user_id=user_id, limit=limit, offset=offset, search=search
            )
        )

    @music_controller.route("playlist/<id>", methods=["GET"])
    def get_playlist(id):
        db_playlist = get_playlist_by_id_or_none(id)
        if db_playlist is not None:
            return db_playlist.__data__
        else:
            access_token = request.cookies.get("spotify_access_token")
            playlist = spotify.get_playlist(access_token=access_token, id=id)
            return playlist.model_dump()

    @music_controller.route("playlist/<id>", methods=["POST"])
    def post_edit_playlist(id):
        access_token = request.cookies.get("spotify_access_token")
        name = request.json.get("name")
        description = request.json.get("description")
        update_playlist_info(id=id, name=name, description=description)
        spotify.update_playlist(
            access_token=access_token,
            id=id,
            name=name,
            description=description,
        )
        return make_response("playlist updated", 204)

    @music_controller.route("playlist/<id>/albums", methods=["GET"])
    def get_playlist_album_info(id):
        db_playlist = get_playlist_by_id_or_none(id)
        if db_playlist is not None:
            album_info_list = get_playlist_albums_with_genres(id)
            return jsonify(album_info_list)
        else:
            access_token = request.cookies.get("spotify_access_token")
            return [
                album.model_dump()
                for album in spotify.get_playlist_album_info(
                    access_token=access_token, id=id
                )
            ]

    @music_controller.route("playlist/<id>/tracks", methods=["GET"])
    def get_playlist_tracks(id):
        db_playlist = get_playlist_by_id_or_none(id)
        if db_playlist is not None:
            track_list = get_playlist_track_list(id)
            return jsonify(track_list)
        else:
            access_token = request.cookies.get("spotify_access_token")
            return [
                album.model_dump()
                for album in spotify.get_playlist_album_info(
                    access_token=access_token, id=id
                )
            ]

    @music_controller.route("playlist/search", methods=["POST"])
    def find_associated_playlists():
        user_id = request.cookies.get("user_id")
        search = request.json
        return search_playlist_names(user_id, search)

    @music_controller.route("playback", methods=["GET"])
    def get_playback_info():
        access_token = request.cookies.get("spotify_access_token")
        playback_info = spotify.get_my_current_playback(access_token=access_token)
        if playback_info is None:
            return ("", 204)
        if playback_info.playlist_id is not None:
            playlist_name = get_playlist_by_id_or_none(playback_info.playlist_id).name
            playlist_duration = get_playlist_duration(playback_info.playlist_id)
            playlist_progress = (
                get_playlist_duration_up_to_track(
                    playback_info.playlist_id, playback_info.track_id
                )
                + playback_info.track_progress
            )

            playback_info_with_playlist = playback_info.model_dump()
            playback_info_with_playlist["playlist"] = {
                "id": playback_info.playlist_id,
                "title": playlist_name,
                "progress": playlist_progress,
                "duration": playlist_duration,
            }
            return playback_info_with_playlist

        return playback_info.model_dump_json()

    return music_controller
