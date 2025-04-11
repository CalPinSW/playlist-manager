from functools import wraps
from flask import Flask, redirect, request
from flask_cors import CORS
import requests
from src.controllers.database import database_controller
from src.controllers.spotify import spotify_controller
from src.controllers.music_data import music_controller
from src.exceptions.Unauthorized import UnauthorizedException
from src.flask_config import Config
from src.musicbrainz import MusicbrainzClient
from src.spotify import SpotifyClient
from src.controllers.auth import auth_controller
from src.database.models import db_wrapper
from jose import jwt
from authlib.integrations.flask_oauth2 import ResourceProtector

from src.utils.logging.configure_logging import configure_app_logging
from src.validator import Auth0JWTBearerTokenValidator

ALGORITHMS = ["RS256"]


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config())
    app.logger.setLevel(app.config["LOGGING_LEVEL"])
    if app.config["LOGGLY_TOKEN"] is not None:
        configure_app_logging(app)

    def get_token_auth_header():
        auth = request.headers.get("Authorization", None)
        if not auth:
            raise Exception("Authorization header is expected")
        token = auth.split(" ")[1]
        return token

    def requires_auth(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_token_auth_header()
            jsonurl = requests.get(
                f'https://{app.config["AUTH0_DOMAIN"]}/.well-known/jwks.json'
            )
            jwks = jsonurl.json()
            unverified_header = jwt.get_unverified_header(token)

            rsa_key = {}
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"],
                    }

            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience="https://playmanbackend.com",
                issuer=f'https://{app.config["AUTH0_DOMAIN"]}/',
            )
            request.user = payload
            return f(*args, **kwargs)

        return decorated

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

    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    f"{Config().FRONTEND_URL}",
                    "https://z9i1dqk-calpin-8081.exp.direct",
                ]
            }
        },
        supports_credentials=True,
    )

    @app.errorhandler(UnauthorizedException)
    def handle_unauthorized_exception(_):
        resp = redirect("/login", 401)
        return resp

    app.register_blueprint(auth_controller(require_auth=requires_auth, spotify=spotify))
    app.register_blueprint(
        spotify_controller(require_auth=requires_auth, spotify=spotify)
    )
    app.register_blueprint(
        music_controller(require_auth=requires_auth, spotify=spotify)
    )
    app.register_blueprint(
        database_controller(
            require_auth=requires_auth,
            spotify=spotify,
            musicbrainz=musicbrainz,
            database=db_wrapper,
            logger=app.logger,
        )
    )

    return app
