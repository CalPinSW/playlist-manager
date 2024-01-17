from flask import Flask, redirect, render_template, request
from src.data.session_albums import add_playlist, delete_playlist, get_playlists

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
