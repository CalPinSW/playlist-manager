import os


class Config:
    def __init__(self):
        """Base configuration variables."""
        self.SECRET_KEY = os.environ.get("SECRET_KEY")
        self.BACKEND_URL = os.environ.get("BACKEND_URL")
        self.FRONTEND_URL = os.environ.get("FRONTEND_URL")
        self.DB_CONNECTION_STRING = os.environ.get("DB_CONNECTION_STRING")
        self.MUSICBRAINZ_URL = os.environ.get("MUSICBRAINZ_URL")
        self.MUSICBRAINZ_USER_AGENT = os.environ.get("MUSICBRAINZ_USER_AGENT")
        self.LOGGING_LEVEL = os.environ.get("LOGGING_LEVEL")
        self.LOGGLY_TOKEN = os.environ.get("LOGGLY_TOKEN")
        self.ENVIRONMENT = os.environ.get("ENVIRONMENT")
        self.AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")

        if not self.SECRET_KEY:
            raise ValueError(
                "No SECRET_KEY set for Flask application. Did you follow the setup instructions?"
            )
