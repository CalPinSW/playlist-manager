from typing import List, Optional
from src.database.crud.album import create_album_or_none
from src.database.models import (
    AlbumArtistRelationship,
    AlbumGenreRelationship,
    DbAlbum,
    DbArtist,
    DbGenre,
    DbPlaylist,
    DbUser,
    PlaylistAlbumRelationship,
    peewee_model_to_dict,
)
from src.dataclasses.album import Album
from src.dataclasses.playlist import Playlist
from peewee import fn
import re
from datetime import datetime


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


def update_playlist_info(
    id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    snapshot_id: Optional[str] = None,
    uri: Optional[str] = None,
) -> DbPlaylist | None:
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if snapshot_id is not None:
        update_data["snapshot_id"] = snapshot_id
    if uri is not None:
        update_data["uri"] = uri

    if update_data:
        query = DbPlaylist.update(update_data).where(DbPlaylist.id == id)
        query.execute()

        updated_playlist = DbPlaylist.get_by_id(id)
        return updated_playlist

    return None


def update_playlist_with_albums(playlist: Playlist, albums: List[Album]):
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


def get_recent_user_playlists(
    user_id: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    search: Optional[str] = None,
) -> List[DbPlaylist]:

    # Use TO_DATE function in PostgreSQL to convert the extracted date into a proper date
    query = (
        DbPlaylist.select()
        .where(
            (
                DbPlaylist.name.startswith("New Albums")
                | DbPlaylist.name.startswith("Best Albums")
            )
        )
        # Convert the date string into a proper date format for ordering
        .order_by(fn.TO_DATE(fn.RIGHT(DbPlaylist.name, 8), "DD/MM/YY").desc())
        .limit(limit)
        .offset(offset)
    )

    if search:
        query = query.where(DbPlaylist.name.contains(search))

    playlists = []
    for playlist in query:
        # Add playlist to the result with parsed date
        playlists.append(
            {
                "id": playlist.id,
                "name": playlist.name,
                "description": playlist.description,
                "image_url": playlist.image_url,
                "user_id": playlist.user.id,
                "snapshot_id": playlist.snapshot_id,
                "uri": playlist.uri,
            }
        )
    return playlists


def get_playlist_albums(playlist_id: str) -> List[DbAlbum]:
    query = (
        DbAlbum.select()
        .join(PlaylistAlbumRelationship)
        .join(DbPlaylist)
        .where(DbPlaylist.id == playlist_id)
    )
    return list(query)


def get_playlist_albums_with_genres(playlist_id: str) -> List[dict]:
    # Step 1: Retrieve all albums associated with the given playlist
    albums_query = (
        DbAlbum.select()
        .join(
            PlaylistAlbumRelationship,
            on=(PlaylistAlbumRelationship.album == DbAlbum.id),
        )
        .join(DbPlaylist, on=(PlaylistAlbumRelationship.playlist == DbPlaylist.id))
        .where(DbPlaylist.id == playlist_id)
    )

    # Step 2: Retrieve genres and artists for each album
    albums_with_details = []
    for album in albums_query:
        genres = (
            DbGenre.select(DbGenre.name)
            .join(
                AlbumGenreRelationship, on=(AlbumGenreRelationship.genre == DbGenre.id)
            )
            .where(AlbumGenreRelationship.album == album.id)
            .execute()
        )

        artists = (
            DbArtist.select()
            .join(
                AlbumArtistRelationship,
                on=(AlbumArtistRelationship.artist == DbArtist.id),
            )
            .where(AlbumArtistRelationship.album == album.id)
        )

        album_details = {
            "id": album.id,
            "name": album.name,
            "uri": album.uri,
            "image_url": album.image_url,
            "release_date": album.release_date,
            "total_tracks": album.total_tracks,
            "genres": [genre.name for genre in genres],
            "artists": [peewee_model_to_dict(artist) for artist in artists],
        }
        albums_with_details.append(album_details)

    return albums_with_details
