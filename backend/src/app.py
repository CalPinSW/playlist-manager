from functools import wraps
from flask import Flask, redirect, request
from flask_cors import CORS
from src.controllers.database import database_controller
from src.controllers.spotify import spotify_controller
from src.controllers.music_data import music_controller
from src.exceptions.Unauthorized import UnauthorizedException
from src.flask_config import Config
from src.musicbrainz import MusicbrainzClient
from src.spotify import SpotifyClient
import jwt
from jwt import PyJWKClient
from src.controllers.auth import auth_controller
from src.database.models import db_wrapper

from src.utils.logging.configure_logging import configure_app_logging

ALGORITHMS = ["RS256"]


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config())
    jwks_url = f'https://{app.config["AUTH0_DOMAIN"]}/.well-known/jwks.json'
    jwks_client = PyJWKClient(jwks_url)
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

            signing_key = jwks_client.get_signing_key_from_jwt(token).key
            try:
                payload = jwt.decode(
                    token,
                    signing_key,
                    algorithms=ALGORITHMS,
                    audience="https://playmanbackend.com",
                    issuer=f'https://{app.config["AUTH0_DOMAIN"]}/',
                )
            except jwt.ExpiredSignatureError:
                return {"message": "token expired"}, 401
            except jwt.JWTClaimsError:
                return {"message": "incorrect claims"}, 401
            except Exception as e:
                return {"message": "invalid token", "error": str(e)}, 401

            request.user = payload  # store decoded token
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
        resources={r"/*": {"origins": "*"}},
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
