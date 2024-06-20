from urllib.parse import urlencode
from uuid import uuid4
from flask import Blueprint, make_response, redirect, request, session
from src.dataclasses.playback_info import PlaybackInfo
from src.spotify import SpotifyClient


def spotify_controller(spotify: SpotifyClient):
    spotify_controller = Blueprint(
        name="spotify_controller", import_name=__name__, url_prefix="/spotify"
    )

    @spotify_controller.route("current-user")
    def get_current_user():
        access_token = request.cookies.get("spotify_access_token")
        user = spotify.get_current_user(access_token=access_token)
        return user.model_dump()

    @spotify_controller.route("playlists")
    def index():
        user_id = request.cookies.get("user_id")
        access_token = request.cookies.get("spotify_access_token")
        limit = request.args.get("limit")
        offset = request.args.get("offset")
        playlists = spotify.get_playlists(
            user_id=user_id, access_token=access_token, limit=limit, offset=offset
        )
        sort_by = request.args.get("sort_by")
        desc = request.args.get("desc") == "True"
        if sort_by is not None:
            playlists.sort(key=lambda x: x[sort_by], reverse=desc)
        return [playlist.model_dump() for playlist in playlists]

    @spotify_controller.route("create-playlist", methods=["POST"])
    def create_playlist():
        user_id = request.cookies.get("user_id")
        access_token = request.cookies.get("spotify_access_token")
        name = request.json.get("name")
        description = request.json.get("description")
        spotify.create_playlist(
            user_id=user_id,
            access_token=access_token,
            name=name,
            description=description,
        )
        return make_response("playlist created", 201)

    @spotify_controller.route("delete-playlist/<id>", methods=["POST"])
    def delete_playlist_by_id(id):
        access_token = request.cookies.get("spotify_access_token")
        spotify.delete_playlist(access_token=access_token, id=id)
        return make_response("playlist deleted", 200)

    @spotify_controller.route("edit-playlist/<id>", methods=["GET"])
    def get_edit_playlist(id):
        access_token = request.cookies.get("spotify_access_token")
        playlist = spotify.get_playlist(access_token=access_token, id=id)
        return playlist.model_dump()

    @spotify_controller.route("edit-playlist/<id>", methods=["POST"])
    def post_edit_playlist(id):
        access_token = request.cookies.get("spotify_access_token")
        name = request.json.get("name")
        description = request.json.get("description")
        spotify.update_playlist(
            access_token=access_token,
            id=id,
            name=name,
            description=description,
        )
        return make_response("playlist updated", 204)

    @spotify_controller.route("playlist/<id>/albums", methods=["GET"])
    def get_playlist_album_info(id):
        access_token = request.cookies.get("spotify_access_token")
        return [
            album.model_dump()
            for album in spotify.get_playlist_album_info(
                access_token=access_token, id=id
            )
        ]

    @spotify_controller.route("playback", methods=["GET"])
    def get_playback_info():
        access_token = request.cookies.get("spotify_access_token")
        playback_info = spotify.get_my_current_playback(access_token=access_token)
        if playback_info is None:
            return ("", 204)
        return playback_info.model_dump_json()

    @spotify_controller.route("playlist_progress", methods=["POST"])
    def get_playlist_progress():
        access_token = request.cookies.get("spotify_access_token")
        api_playback = PlaybackInfo.model_validate(request.json)
        playlist_progression = spotify.get_playlist_progression(
            access_token=access_token, api_playback=api_playback
        )
        if playlist_progression is None:
            return ("", 204)
        return playlist_progression.model_dump_json()

    return spotify_controller
