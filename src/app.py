from flask import Flask, render_template
from src.data.session_albums import get_playlists

from src.flask_config import Config

app = Flask(__name__)
app.config.from_object(Config())


@app.route("/")
def index():
    playlists = get_playlists()
    return render_template("index.html", playlists=playlists)
