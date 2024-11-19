from flask import Blueprint, make_response, request
from src.dataclasses.playback_info import PlaybackInfo
from src.dataclasses.playback_request import StartPlaybackRequest
from src.spotify import SpotifyClient


def spotify_controller(spotify: SpotifyClient):
    spotify_controller = Blueprint(
        name="spotify_controller", import_name=__name__, url_prefix="/spotify"
    )

    @spotify_controller.route("current-user")
    def get_current_user():
        user_id = request.cookies.get("user_id")
        user = spotify.get_user_by_id(user_id=user_id)
        return user.model_dump()

    @spotify_controller.route("playlists")
    def index():
        user_id = request.cookies.get("user_id")
        limit = request.args.get("limit")
        offset = request.args.get("offset")
        playlists = spotify.get_playlists(user_id=user_id, limit=limit, offset=offset)
        sort_by = request.args.get("sort_by")
        desc = request.args.get("desc") == "True"
        if sort_by is not None:
            playlists.items.sort(key=lambda x: x[sort_by], reverse=desc)
        return [playlist.model_dump() for playlist in playlists.items]

    @spotify_controller.route("create-playlist", methods=["POST"])
    def create_playlist():
        user_id = request.cookies.get("user_id")
        name = request.json.get("name")
        description = request.json.get("description")
        spotify.create_playlist(
            user_id=user_id,
            name=name,
            description=description,
        )
        return make_response("playlist created", 201)

    @spotify_controller.route("delete-playlist/<id>", methods=["POST"])
    def delete_playlist_by_id(id):
        user_id = request.cookies.get("user_id")
        spotify.delete_playlist(user_id=user_id, id=id)
        return make_response("playlist deleted", 200)

    @spotify_controller.route("playlist/<id>", methods=["GET"])
    def get_edit_playlist(id):
        user_id = request.cookies.get("user_id")
        playlist = spotify.get_playlist(user_id=user_id, id=id)
        return playlist.model_dump()

    @spotify_controller.route("edit-playlist/<id>", methods=["POST"])
    def post_edit_playlist(id):
        user_id = request.cookies.get("user_id")
        name = request.json.get("name")
        description = request.json.get("description")
        spotify.update_playlist(
            user_id=user_id,
            id=id,
            name=name,
            description=description,
        )
        return make_response("playlist updated", 204)

    @spotify_controller.route("playlist/<id>/albums", methods=["GET"])
    def get_playlist_album_info(id):
        user_id = request.cookies.get("user_id")
        return [
            album.model_dump()
            for album in spotify.get_playlist_album_info(user_id=user_id, id=id)
        ]

    @spotify_controller.route("playback", methods=["GET"])
    def get_playback_info():
        user_id = request.cookies.get("user_id")
        playback_info = spotify.get_my_current_playback(user_id=user_id)
        if playback_info is None:
            return ("", 204)
        return playback_info.model_dump_json()

    @spotify_controller.route("playlist_progress", methods=["POST"])
    def get_playlist_progress():
        user_id = request.cookies.get("user_id")
        api_playback = PlaybackInfo.model_validate(request.json)
        playlist_progression = spotify.get_playlist_progression(
            user_id=user_id, api_playback=api_playback
        )
        if playlist_progression is None:
            return ("", 204)
        return playlist_progression.model_dump_json()

    @spotify_controller.route("find_associated_playlists/<id>", methods=["GET"])
    def find_associated_playlists(playlist_id):
        user_id = request.cookies.get("user_id")
        associated_playlists = spotify.find_associated_playlists(
            user_id=user_id, playlist_id=playlist_id
        )
        return [
            associated_playlist.model_dump()
            for associated_playlist in associated_playlists
        ]

    @spotify_controller.route("add_album_to_playlist", methods=["POST"])
    def add_album_to_playlist():
        user_id = request.cookies.get("user_id")
        request_body = request.json
        playlist_id = request_body["playlistId"]
        album_id = request_body["albumId"]
        if not playlist_id or not album_id:
            return make_response(
                "Invalid request payload. Expected playlistId and albumId.", 400
            )
        return spotify.add_album_to_playlist(
            user_id=user_id, playlist_id=playlist_id, album_id=album_id
        )

    @spotify_controller.route("pause_playback", methods=["PUT"])
    def pause_playback():
        user_id = request.cookies.get("user_id")
        return spotify.pause_playback(user_id)

    @spotify_controller.route("start_playback", methods=["PUT"])
    def start_playback():
        user_id = request.cookies.get("user_id")
        request_body = request.json
        start_playback_request_body = (
            StartPlaybackRequest.model_validate(request_body) if request_body else None
        )
        return spotify.start_playback(
            user_id=user_id, start_playback_request_body=start_playback_request_body
        )

    @spotify_controller.route("pause_or_start_playback", methods=["PUT"])
    def pause_or_start_playback():
        user_id = request.cookies.get("user_id")
        return spotify.pause_or_start_playback(user_id=user_id)

    return spotify_controller
