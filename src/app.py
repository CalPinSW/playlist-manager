from flask import Flask, redirect, render_template, request
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


@app.route("/")
def index():
    playlists = get_playlists()
    return render_template("index.html", playlists=playlists)


@app.route("/create-playlist", methods=["POST"])
def create_playlist():
    title = request.form.get("title")
    description = request.form.get("description")
    add_playlist(title, description)
    return redirect("/")


@app.route("/delete-playlist/<int:id>", methods=["POST"])
def delete_playlist_by_id(id):
    delete_playlist(id)
    return redirect("/")


@app.route("/edit-playlist/<int:id>", methods=["GET"])
def get_edit_playlist(id):
    playlist = get_playlist(id)
    return render_template("edit_playlist.html", playlist=playlist)


@app.route("/edit-playlist/<int:id>", methods=["POST"])
def post_edit_playlist(id):
    title = request.form.get("title")
    description = request.form.get("description")
    save_playlist({"id": id, "title": title, "description": description})
    return redirect("/")
