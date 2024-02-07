from flask import Flask, redirect, render_template, request
from flask_cors import CORS, cross_origin
from src.data.session_playlists import (
    add_playlist,
    delete_playlist,
    get_playlist,
    get_playlists,
    save_playlist,
)

from src.flask_config import Config

app = Flask(__name__)

app.config.from_object(Config())
app.config["CORS_HEADERS"] = "Content-Type"

cors = CORS(app, resources={r"/foo": {"origins": "http://localhost:3000"}})


@app.route("/")
@cross_origin(origin="localhost", headers=["Content- Type", "Authorization"])
def index():
    playlists = get_playlists()
    sort_by = request.args.get("sort_by")
    desc = request.args.get("desc") == "True"
    if sort_by is not None:
        playlists.sort(key=lambda x: x[sort_by], reverse=desc)
    return playlists


@app.route("/create-playlist", methods=["POST"])
@cross_origin(origin="localhost", headers=["Content- Type", "Authorization"])
def create_playlist():
    title = request.form.get("title")
    description = request.form.get("description")
    add_playlist(title, description)
    return redirect("/")


@app.route("/delete-playlist/<int:id>", methods=["POST"])
@cross_origin(origin="localhost", headers=["Content- Type", "Authorization"])
def delete_playlist_by_id(id):
    delete_playlist(id)
    return redirect("/")


@app.route("/edit-playlist/<int:id>", methods=["GET"])
@cross_origin(origin="localhost", headers=["Content- Type", "Authorization"])
def get_edit_playlist(id):
    playlist = get_playlist(id)
    return playlist


@app.route("/edit-playlist/<int:id>", methods=["POST"])
@cross_origin(origin="localhost", headers=["Content- Type", "Authorization"])
def post_edit_playlist(id):
    title = request.form.get("title")
    description = request.form.get("description")
    save_playlist({"id": id, "title": title, "description": description})
    return redirect("/")
