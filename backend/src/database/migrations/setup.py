from flask import Flask
from src.database.models import (
    db_wrapper,
)
from src.flask_config import Config
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.config["DATABASE"] = Config().DB_CONNECTION_STRING
db_wrapper.init_app(app)
database = db_wrapper.database
