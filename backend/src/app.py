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
from loggly.handlers import HTTPSHandler
from pythonjsonlogger.json import JsonFormatter
from logging import getLogger
import logging


class EnvironmentFilter(logging.Filter):
    def __init__(self, environment):
        super().__init__()
        self.environment = environment

    def filter(self, record):
        record.environment = self.environment
        return True


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config())
    app.logger.setLevel(app.config["LOGGING_LEVEL"])
    if app.config["LOGGLY_TOKEN"] is not None:
        jsonFormatter = JsonFormatter(
            "[%(asctime)s] %(levelname)s in %(module)s [%(environment)s]: %(message)s"
        )
        loggly_url = f'https://logs-01.loggly.com/inputs/{app.config["LOGGLY_TOKEN"]}/tag/playman'

        # Default Logging
        handler = HTTPSHandler(loggly_url)
        handler.setFormatter(jsonFormatter)
        handler.addFilter(EnvironmentFilter(app.config["ENVIRONMENT"]))
        app.logger.addHandler(handler)

        # Request Logging
        request_logger = getLogger("werkzeug")
        request_logger.setLevel(app.config["LOGGING_LEVEL"])
        request_handler = HTTPSHandler(loggly_url + "-requests")
        request_handler.setFormatter(jsonFormatter)
        request_handler.addFilter(EnvironmentFilter(app.config["ENVIRONMENT"]))
        request_logger.addHandler(request_handler)

        # DB Logging
        db_logger = logging.getLogger("peewee")
        db_logger.setLevel(app.config["LOGGING_LEVEL"])
        db_handler = HTTPSHandler(loggly_url + "-db")
        db_handler.setFormatter(jsonFormatter)
        db_handler.addFilter(EnvironmentFilter(app.config["ENVIRONMENT"]))
        db_logger.addHandler(db_handler)

    spotify = SpotifyClient()
    musicbrainz = MusicbrainzClient(logger=app.logger)
    app.config["DATABASE"] = Config().DB_CONNECTION_STRING
    db_wrapper.init_app(app)

    app.config["CORS_HEADERS"] = "Content-Type"

    # Since the backend runs on a different host to the frontend in production,
    # we need to setup cookies to work across the different urls,
    # otherwise they are not sent to the backend in authenticated requests.
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE="True",
    )
    if Config().USE_CORS:
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
    else:
        CORS(
            app,
            resources={r"/*": {"origins": "*"}},
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
            spotify=spotify,
            musicbrainz=musicbrainz,
            database=db_wrapper,
            logger=app.logger,
        )
    )

    return app
