from flask import Flask, redirect
from flask_cors import CORS
from src.controllers.database import database_controller
from src.controllers.spotify import spotify_controller
from src.controllers.music_data import music_controller
from src.exceptions.Unauthorized import UnauthorizedException
from src.flask_config import Config
from src.musicbrainz import MusicbrainzClient
from src.spotify import SpotifyClient
from src.controllers.auth import auth_controller
from src.database.models import db_wrapper


def create_app():
    app = Flask(__name__)
    spotify = SpotifyClient()
    musicbrainz = MusicbrainzClient()
    app.config["DATABASE"] = Config().DB_CONNECTION_STRING
    db_wrapper.init_app(app)

    app.config.from_object(Config())
    app.config["CORS_HEADERS"] = "Content-Type"

    # Since the backend runs on a different host to the frontend in production,
    # we need to setup cookies to work across the different urls,
    # otherwise they are not sent to the backend in authenticated requests.
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE="True",
    )

    CORS(
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
        resp = redirect("/login", 401)
        return resp

    app.register_blueprint(auth_controller(spotify=spotify))
    app.register_blueprint(spotify_controller(spotify=spotify))
    app.register_blueprint(music_controller(spotify=spotify))
    app.register_blueprint(
        database_controller(
            spotify=spotify, musicbrainz=musicbrainz, database=db_wrapper
        )
    )

    return app
