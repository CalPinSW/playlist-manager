from src.dataclasses.album import Album
from src.database.models import (
    AlbumArtistRelationship,
    AlbumGenreRelationship,
    DbGenre,
    DbAlbum,
    DbArtist,
)


def create_album_or_none(album: Album):
    if DbAlbum.get_or_none(DbAlbum.id == album.id):
        return
    album = DbAlbum.create(
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
    for artist in album.artists:
        DbArtist.get_or_create(
            id=artist.id,
            image_url=album.images[0].url if album.images else None,
            name=artist.name,
            uri=artist.uri,
        )
        AlbumArtistRelationship.create(album=album.id, artist=artist.id)
    for genre in album.genres or []:
        db_genre = DbGenre.get_or_create(name=genre)
        AlbumGenreRelationship.create(album=album.id, genre=db_genre.id)

    return album
