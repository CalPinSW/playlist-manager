from typing import List, Optional
from src.database.crud.album import create_album_or_none
from src.database.models import DbAlbum, DbPlaylist, DbUser, PlaylistAlbumRelationship
from src.dataclasses.album import Album
from src.dataclasses.playlist import Playlist


def get_playlist_by_id_or_none(id: str):
    return DbPlaylist.get_or_none(DbPlaylist.id == id)


def create_playlist(playlist: Playlist, albums: List[Album], user: DbUser):
    playlist = DbPlaylist.create(
        id=playlist.id,
        description=playlist.description,
        image_url=playlist.images[0].url if playlist.images else None,
        name=playlist.name,
        user=user.id,
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
        user_id=playlist.owner.id,
        snapshot_id=playlist.snapshot_id,
        uri=playlist.uri,
    )
    PlaylistAlbumRelationship.delete().where(playlist=playlist.id)

    for album in albums:
        create_album_or_none(album)
        PlaylistAlbumRelationship.create(playlist=playlist.id, album=album.id)

    return playlist


def get_user_playlists(
    user_id: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    desc: bool = True,
    as_dicts: bool = False,
) -> List[DbPlaylist]:
    query = DbPlaylist.select().where(DbPlaylist.user == user_id)

    if search:
        query = query.where(DbPlaylist.name.contains(search))

    if sort_by:
        sort_field = getattr(DbPlaylist, sort_by)
        if desc:
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())

    if limit is not None:
        query = query.limit(limit)
    if offset is not None:
        query = query.offset(offset)

    if as_dicts:
        return list(query.dicts())
    else:
        return list(query.execute())


def get_playlist_albums(playlist_id: str) -> List[DbAlbum]:
    query = (
        DbAlbum.select()
        .join(PlaylistAlbumRelationship)
        .join(DbPlaylist)
        .where(DbPlaylist.id == playlist_id)
    )
    return list(query)
