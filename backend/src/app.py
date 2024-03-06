from flask import Flask, redirect, request
from flask_cors import CORS
from src.data.session_playlists import (
    add_playlist,
    delete_playlist,
)
from src.flask_config import Config
from src.spotify import SpotifyClient

app = Flask(__name__)
app.config.from_pyfile("settings.py")
spotify = SpotifyClient()

app.config.from_object(Config())
app.config["CORS_HEADERS"] = "Content-Type"

cors = CORS(
    app,
    resources={r"/*": {"origins": ["http://127.0.0.1:1234", "http://localhost:1234"]}},
    supports_credentials=True,
)


@app.route("/")
def index():
    limit = request.args.get("limit")
    offset = request.args.get("offset")
    playlists = spotify.get_playlists(limit=limit, offset=offset)
    sort_by = request.args.get("sort_by")
    desc = request.args.get("desc") == "True"
    if sort_by is not None:
        playlists.sort(key=lambda x: x[sort_by], reverse=desc)
    return playlists


@app.route("/create-playlist", methods=["POST"])
def create_playlist():
    name = request.form.get("name")
    description = request.form.get("description")
    spotify.create_playlist(name, description)
    return redirect("/")


@app.route("/delete-playlist/<id>", methods=["POST"])
def delete_playlist_by_id(id):
    spotify.delete_playlist(id)
    return redirect("/")


@app.route("/edit-playlist/<id>", methods=["GET"])
def get_edit_playlist(id):
    playlist = spotify.get_playlist(id)
    return playlist


@app.route("/edit-playlist/<id>", methods=["POST"])
def post_edit_playlist(id):
    name = request.form.get("name")
    description = request.form.get("description")
    spotify.update_playlist(id, name, description)
    return redirect("/")
