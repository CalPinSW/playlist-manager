from http.client import HTTPException
from urllib.parse import urlencode
from flask import Flask, make_response, redirect, request
from flask_cors import CORS
from src.dataclasses.playback_info import PlaybackInfo
from src.exceptions.Unauthorized import UnauthorizedException
from src.flask_config import Config
from src.spotify import SpotifyClient


def create_app():
    app = Flask(__name__)
    spotify = SpotifyClient()

    app.config.from_object(Config())
    app.config["CORS_HEADERS"] = "Content-Type"
    cors = CORS(
        app,
        resources={
            r"/*": {"origins": [f"http://{Config().HOST}:1234", "http://locahost:1234"]}
        },
        supports_credentials=True,
    )

    @app.errorhandler(UnauthorizedException)
    def handle_unauthorized_exception(_):
        resp = make_response(
            "Spotify access token invalid or missing. Please re-authenticate.", 401
        )
        resp.delete_cookie("spotify_access_token")
        resp.delete_cookie("user_id")
        return resp

    @app.route("/")
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

    @app.route("/auth/login")
    def login():
        state = "thisShouldBeARandomString"
        query_string = spotify.get_login_query_string(state)
        return "https://accounts.spotify.com/authorize?" + query_string

    @app.route("/auth/get-user-code")
    def auth_redirect():
        code = request.args.get("code")
        state = request.args.get("state")
        if state is None:
            return redirect("/#" + urlencode({"error": "state_mismatch"}))
        return spotify.request_access_token(code=code)

    @app.route("/current-user")
    def get_current_user():
        access_token = request.cookies.get("spotify_access_token")
        user = spotify.get_current_user(access_token=access_token)
        return user.model_dump()

    @app.route("/create-playlist", methods=["POST"])
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
        return redirect("/")

    @app.route("/delete-playlist/<id>", methods=["POST"])
    def delete_playlist_by_id(id):
        access_token = request.cookies.get("spotify_access_token")
        spotify.delete_playlist(access_token=access_token, id=id)
        return redirect("/")

    @app.route("/edit-playlist/<id>", methods=["GET"])
    def get_edit_playlist(id):
        access_token = request.cookies.get("spotify_access_token")
        playlist = spotify.get_playlist(access_token=access_token, id=id)
        return playlist.model_dump()

    @app.route("/edit-playlist/<id>", methods=["POST"])
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
        return redirect("/")

    @app.route("/playback", methods=["GET"])
    def get_playback_info():
        access_token = request.cookies.get("spotify_access_token")
        playback_info = spotify.get_my_current_playback(access_token=access_token)
        if playback_info is None:
            return ("", 204)
        return playback_info.model_dump_json()

    @app.route("/playlist_progress", methods=["POST"])
    def get_playlist_progress():
        access_token = request.cookies.get("spotify_access_token")
        api_playback = PlaybackInfo.model_validate(request.json)
        playlist_progression = spotify.get_playlist_progression(
            access_token=access_token, api_playback=api_playback
        )
        if playlist_progression is None:
            return ("", 204)
        return playlist_progression.model_dump_json()

    return app
