from uuid import uuid4
from flask import Blueprint, make_response, redirect, request, session
from src.flask_config import Config
from src.spotify import SpotifyClient
from src.utils.response_creator import add_cookies_to_response


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

    @auth_controller.route("logout")
    def logout():
        resp = make_response("Logged out")
        resp.delete_cookie("spotify_access_token")
        resp.delete_cookie("spotify_refresh_token")
        resp.delete_cookie("user_id")
        resp.delete_cookie("session")
        return resp

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
        user_id = request.cookies.get("user_id")
        (user_id, _, _) = spotify.refresh_access_token(user_id=user_id)
        return add_cookies_to_response(
            make_response(),
            {
                "user_id": user_id,
            },
        )

    return auth_controller
