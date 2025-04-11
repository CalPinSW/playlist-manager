from uuid import uuid4
from flask import Blueprint, jsonify, make_response, redirect, request, session
import requests
from src.database.crud.user import get_user_by_auth0_id, get_user_tokens
from src.flask_config import Config
from src.spotify import SpotifyClient
from src.utils.response_creator import add_cookies_to_response
from authlib.integrations.flask_oauth2 import ResourceProtector


def auth_controller(require_auth: ResourceProtector, spotify: SpotifyClient):
    auth_controller = Blueprint(
        name="auth_controller", import_name=__name__, url_prefix="/auth"
    )

    def get_user_info(access_token):
        url = f"https://dev-3tozp8qy1u0rfxfm.us.auth0.com/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(url, headers=headers)
        return response.json()

    @auth_controller.route("spotify/login")
    @require_auth
    def login():
        state = str(uuid4())
        session["SpotifyState"] = state
        query_string = spotify.get_login_query_string(state)
        return "https://accounts.spotify.com/authorize?" + query_string

    @auth_controller.route("spotify/user-status")
    @require_auth
    def spotify_status():
        access_token = request.headers.get("Authorization").split(" ")[1]
        user_data = get_user_info(access_token)
        auth0_id = user_data.get("sub")
        user = get_user_by_auth0_id(auth0_id)
        if user:
            user_tokens = get_user_tokens(user.id)

        return jsonify({"spotifyLinked": bool(user and user_tokens.access_token)}), 200

    @auth_controller.route("logout")
    @require_auth
    def logout():
        resp = make_response("Logged out")
        resp.delete_cookie("spotify_access_token")
        resp.delete_cookie("spotify_refresh_token")
        resp.delete_cookie("user_id")
        resp.delete_cookie("session")
        return resp

    @auth_controller.route("get-user-code")
    @require_auth
    def auth_redirect():
        code = request.args.get("code")
        state = request.args.get("state")
        test = session["SpotifyState"]
        if state != test:
            return make_response({"error": test}, 401)
        return spotify.request_access_token(code=code)

    @auth_controller.route("refresh-user-code")
    @require_auth
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
