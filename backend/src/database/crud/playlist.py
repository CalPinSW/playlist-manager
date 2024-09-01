from typing import List
from src.database.crud.album import create_album_or_none
from src.database.models import DbPlaylist, PlaylistAlbumRelationship
from src.dataclasses.album import Album
from src.dataclasses.playlist import Playlist


def get_playlist_by_id_or_none(id: str):
    return DbPlaylist.get_or_none(DbPlaylist.id == id)


def create_playlist(playlist: Playlist, albums: List[Album]):
    playlist = DbPlaylist.create(
        id=playlist.id,
        description=playlist.description,
        image_url=playlist.images[0].url if playlist.images else None,
        name=playlist.name,
        owner=playlist.owner.id,
        snapshot_id=playlist.snapshot_id,
        uri=playlist.uri,
    )

    for album in albums:
        create_album_or_none(album)
        PlaylistAlbumRelationship.create(playlist=playlist.id, album=album.id)

    return playlist


def update_playlist(playlist: Playlist, albums: List[Album]):
    playlist = DbPlaylist.update(
        id=playlist.id,
        description=playlist.description,
        image_url=playlist.images[0].url if playlist.images else None,
        name=playlist.name,
        owner=playlist.owner.id,
        snapshot_id=playlist.snapshot_id,
        uri=playlist.uri,
    )
    PlaylistAlbumRelationship.delete().where(playlist=playlist.id)

    for album in albums:
        create_album_or_none(album)
        PlaylistAlbumRelationship.create(playlist=playlist.id, album=album.id)

    return playlist
