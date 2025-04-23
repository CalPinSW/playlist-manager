from flask import Blueprint, make_response, request
from src.database.crud.user import get_user_by_auth0_id
from src.dataclasses.playback_info import PlaybackInfo
from src.dataclasses.playback_request import StartPlaybackRequest
from src.spotify import SpotifyClient
from authlib.integrations.flask_oauth2 import ResourceProtector


def spotify_controller(require_auth: ResourceProtector, spotify: SpotifyClient):
    spotify_controller = Blueprint(
        name="spotify_controller", import_name=__name__, url_prefix="/spotify"
    )

    def get_requesting_db_user():
        db_user = get_user_by_auth0_id(request.user["sub"])
        return db_user

    @spotify_controller.route("current-user")
    @require_auth
    def get_user_info():
        db_user = get_requesting_db_user()
        user = spotify.get_user_by_id(db_user.id)
        return user.model_dump()

    @spotify_controller.route("playlists")
    @require_auth
    def index():
        db_user = get_requesting_db_user()
        limit = request.args.get("limit")
        offset = request.args.get("offset")
        playlists = spotify.get_playlists(
            user_id=db_user.id, limit=limit, offset=offset
        )
        sort_by = request.args.get("sort_by")
        desc = request.args.get("desc") == "True"
        if sort_by is not None:
            playlists.items.sort(key=lambda x: x[sort_by], reverse=desc)
        return [playlist.model_dump() for playlist in playlists.items]

    @spotify_controller.route("create-playlist", methods=["POST"])
    @require_auth
    def create_playlist():
        db_user = get_requesting_db_user()
        name = request.json.get("name")
        description = request.json.get("description")
        spotify.create_playlist(
            user_id=db_user.id,
            name=name,
            description=description,
        )
        return make_response("playlist created", 201)

    @spotify_controller.route("delete-playlist/<id>", methods=["POST"])
    @require_auth
    def delete_playlist_by_id(id):
        db_user = get_requesting_db_user()
        spotify.delete_playlist(user_id=db_user.id, id=id)
        return make_response("playlist deleted", 200)

    @spotify_controller.route("playlist/<id>", methods=["GET"])
    @require_auth
    def get_edit_playlist(id):
        db_user = get_requesting_db_user()
        playlist = spotify.get_playlist(user_id=db_user.id, id=id)
        return playlist.model_dump()

    @spotify_controller.route("edit-playlist/<id>", methods=["POST"])
    @require_auth
    def post_edit_playlist(id):
        db_user = get_requesting_db_user()
        name = request.json.get("name")
        description = request.json.get("description")
        spotify.update_playlist(
            user_id=db_user.id,
            id=id,
            name=name,
            description=description,
        )
        return make_response("playlist updated", 204)

    @spotify_controller.route("playlist/<id>/albums", methods=["GET"])
    @require_auth
    def get_playlist_album_info(id):
        db_user = get_requesting_db_user()
        return [
            album.model_dump()
            for album in spotify.get_playlist_album_info(user_id=db_user.id, id=id)
        ]

    @spotify_controller.route("playback", methods=["GET"])
    @require_auth
    def get_playback_info():
        db_user = get_requesting_db_user()
        playback_info = spotify.get_my_current_playback(user_id=db_user.id)
        if playback_info is None:
            return ("", 204)
        return playback_info.model_dump_json()

    @spotify_controller.route("playlist_progress", methods=["POST"])
    @require_auth
    def get_playlist_progress():
        db_user = get_requesting_db_user()
        api_playback = PlaybackInfo.model_validate(request.json)
        playlist_progression = spotify.get_playlist_progression(
            user_id=db_user.id, api_playback=api_playback
        )
        if playlist_progression is None:
            return ("", 204)
        return playlist_progression.model_dump_json()

    @spotify_controller.route("find_associated_playlists/<id>", methods=["GET"])
    @require_auth
    def find_associated_playlists(playlist_id):
        db_user = get_requesting_db_user()
        associated_playlists = spotify.find_associated_playlists(
            user_id=db_user.id, playlist_id=playlist_id
        )
        return [
            associated_playlist.model_dump()
            for associated_playlist in associated_playlists
        ]

    @spotify_controller.route("add_album_to_playlist", methods=["POST"])
    @require_auth
    def add_album_to_playlist():
        db_user = get_requesting_db_user()
        request_body = request.json
        playlist_id = request_body["playlistId"]
        album_id = request_body["albumId"]
        if not playlist_id or not album_id:
            return make_response(
                "Invalid request payload. Expected playlistId and albumId.", 400
            )
        return spotify.add_album_to_playlist(
            user_id=db_user.id, playlist_id=playlist_id, album_id=album_id
        )

    @spotify_controller.route("pause_playback", methods=["PUT"])
    @require_auth
    def pause_playback():
        db_user = get_requesting_db_user()
        return spotify.pause_playback(db_user.id)

    @spotify_controller.route("start_playback", methods=["PUT"])
    @require_auth
    def start_playback():
        db_user = get_requesting_db_user()
        request_body = request.json if request.content_length > 0 else None
        print(request_body)
        start_playback_request_body = (
            StartPlaybackRequest.model_validate(request_body) if request_body else None
        )
        return spotify.start_playback(
            user_id=db_user.id, start_playback_request_body=start_playback_request_body
        )

    @spotify_controller.route("pause_or_start_playback", methods=["PUT"])
    @require_auth
    def pause_or_start_playback():
        db_user = get_requesting_db_user()
        return spotify.pause_or_start_playback(user_id=db_user.id)

    return spotify_controller
