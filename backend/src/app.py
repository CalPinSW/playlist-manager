from flask import Flask, make_response
from flask_cors import CORS
from src.controllers.spotify import spotify_controller
from src.exceptions.Unauthorized import UnauthorizedException
from src.flask_config import Config
from src.spotify import SpotifyClient
from src.controllers.auth import auth_controller


def create_app():
    app = Flask(__name__)
    spotify = SpotifyClient()
    app.config.from_object(Config())
    app.config["CORS_HEADERS"] = "Content-Type"

    # Since the backend runs on a different host to the frontend in production,
    # we need to setup cookies to work across the different urls,
    # otherwise they are not sent to the backend in authenticated requests.
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE="True",
    )

    cors = CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    f"{Config().FRONTEND_URL}",
                ]
            }
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

    app.register_blueprint(auth_controller(spotify=spotify))
    app.register_blueprint(spotify_controller(spotify=spotify))
    return app
