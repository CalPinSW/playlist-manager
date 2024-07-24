from uuid import uuid4
from flask import Blueprint, make_response, request, session
from src.spotify import SpotifyClient


def auth_controller(spotify: SpotifyClient):
    auth_controller = Blueprint(
        name="auth_controller", import_name=__name__, url_prefix="/auth"
    )

    @auth_controller.route("login")
    def login():
        state = str(uuid4())
        session["SpotifyState"] = state
        query_string = spotify.get_login_query_string(state)
        return "https://accounts.spotify.com/authorize?" + query_string

    @auth_controller.route("get-user-code")
    def auth_redirect():
        code = request.args.get("code")
        state = request.args.get("state")
        test = session["SpotifyState"]
        if state != test:
            return make_response({"error": test}, 401)
        return spotify.request_access_token(code=code)

    @auth_controller.route("refresh-user-code")
    def auth_refresh():
        refresh_token = request.cookies.get("spotify_refresh_token")
        return spotify.refresh_access_token(refresh_token=refresh_token)

    return auth_controller
