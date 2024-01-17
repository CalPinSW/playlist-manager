from flask import session

_DEFAULT_PLAYLISTS = [
    {"id": 1, "title": "Playlist 1", "description": "A collection of albums"},
    {"id": 2, "title": "Playlist 2", "description": "Some more good albums"},
]


def get_playlists():
    """
    Fetches all saved playlists from the session.

    Returns:
        list: The list of saved playlists.
    """
    return session.get("playlists", _DEFAULT_PLAYLISTS.copy())


def get_playlist(id):
    """
    Fetches the saved playlist with the specified ID.

    Args:
        id: The ID of the playlist.

    Returns:
        playlist: The saved playlist, or None if no playlists match the specified ID.
    """
    playlists = get_playlists()
    return next((playlist for playlist in playlists if playlist["id"] == int(id)), None)


def add_playlist(title, description):
    """
    Adds a new playlist with the specified title to the session.

    Args:
        title: The title of the playlist.

    Returns:
        playlist: The saved playlist.
    """
    playlists = get_playlists()

    # Determine the ID for the playlist based on that of the previously added playlist
    id = playlists[-1]["id"] + 1 if playlists else 0

    playlist = {"id": id, "title": title, "description": description}

    # Add the playlist to the list
    playlists.append(playlist)
    session["playlists"] = playlists

    return playlist


def save_playlist(playlist):
    """
    Updates an existing playlist in the session. If no existing playlist matches the ID of the specified playlist, nothing is saved.

    Args:
        playlist: The playlist to save.
    """
    existing_playlists = get_playlists()
    updated_playlists = [
        playlist if playlist["id"] == existing_playlist["id"] else existing_playlist
        for existing_playlist in existing_playlists
    ]

    session["playlists"] = updated_playlists

    return playlist


def delete_playlist(id):
    """
    Deletes an existing playlist in the session by id. If no existing playlist matches the specified ID, nothing is deleted.

    Args:
        playlist: The playlist to delete.
    """
    existing_playlists = get_playlists()
    updated_playlists = [
        playlist for playlist in existing_playlists if playlist["id"] != id
    ]

    print(updated_playlists)
    session["playlists"] = updated_playlists
