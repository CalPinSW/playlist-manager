from typing import List
from src.database.crud.artist import create_or_update_artist
from src.database.crud.track import create_track_or_none
from src.dataclasses.album import Album
from src.database.models import (
    AlbumArtistRelationship,
    AlbumGenreRelationship,
    DbArtist,
    DbGenre,
    DbAlbum,
    DbPlaylist,
    PlaylistAlbumRelationship,
)
from peewee import JOIN


def get_or_create_album(album: Album, ignore_tracks=False):
    existing_db_album = DbAlbum.get_or_none(DbAlbum.id == album.id)
    if existing_db_album:
        return existing_db_album
    db_album = DbAlbum.create(
        id=album.id,
        album_type=album.album_type,
        total_tracks=album.total_tracks,
        image_url=album.images[0].url if album.images else None,
        name=album.name,
        release_date=album.release_date,
        release_date_precision=album.release_date_precision,
        label=album.label,
        uri=album.uri,
    )
    for artist in db_album.artists:
        create_or_update_artist(artist)
        AlbumArtistRelationship.create(album=album.id, artist=artist.id)
    for genre in db_album.genres or []:
        db_genre = DbGenre.get_or_create(name=genre)
        AlbumGenreRelationship.create(album=album.id, genre=db_genre.id)
    if not ignore_tracks:
        for track in album.tracks:
            create_track_or_none(track, album)

    return db_album


def update_album(album: Album):
    updated_albums = (
        DbAlbum.update(
            album_type=album.album_type,
            total_tracks=album.total_tracks,
            image_url=album.images[0].url if album.images else None,
            name=album.name,
            release_date=album.release_date,
            release_date_precision=album.release_date_precision,
            label=album.label,
            uri=album.uri,
        )
        .where(DbAlbum.id == album.id)
        .returning(DbAlbum)
        .execute()
    )
    db_album = list(updated_albums)[0]

    for artist in album.artists:
        db_artist = create_or_update_artist(artist)
        AlbumArtistRelationship.get_or_create(album=db_album, artist=db_artist)
    for genre in album.genres or []:
        db_genre = DbGenre.get_or_none(name=genre)
        if db_genre:
            AlbumGenreRelationship.get_or_create(album=db_album, genre=db_genre)
    return album


def get_album_genres(album_id: str) -> List[str]:
    query = (
        DbGenre.select()
        .join(AlbumGenreRelationship)
        .join(DbAlbum)
        .where(DbAlbum.id == album_id)
    )
    return list(query)


def add_genres_to_album(album: DbAlbum, genres: List[str]) -> DbAlbum:
    for genre in genres or []:
        db_genre = DbGenre.get_or_none(name=genre)
        if db_genre:
            AlbumGenreRelationship.get_or_create(album=album, genre=db_genre)

    return album


def get_album_artists(album: DbAlbum) -> List[DbArtist]:
    query = (
        DbArtist.select()
        .join(AlbumArtistRelationship)
        .join(DbAlbum)
        .where(DbAlbum.id == album.id)
    )
    return list(query)


def get_user_albums(user_id: str) -> List[DbAlbum]:
    query = (
        DbAlbum.select()
        .join(PlaylistAlbumRelationship)
        .join(DbPlaylist)
        .where(DbPlaylist.user == user_id)
    )
    return list(query)


def get_user_albums_with_no_artists(user_id: str) -> List[DbAlbum]:
    query = (
        DbAlbum.select(DbAlbum)
        .join(
            PlaylistAlbumRelationship,
            on=(PlaylistAlbumRelationship.album == DbAlbum.id),
        )
        .join(DbPlaylist)
        .switch(DbAlbum)  # Switch back to Album after joining Playlist
        .join(
            AlbumArtistRelationship,
            JOIN.LEFT_OUTER,
            on=(AlbumArtistRelationship.album == DbAlbum.id),
        )
        .where(AlbumArtistRelationship.artist.is_null(True))
    )
    return list(query)
