from src.database.models import (
    DbAlbum,
    AlbumArtistRelationship,
    AlbumGenreRelationship,
    DbArtist,
    DbGenre,
    DbPlaylist,
    PlaylistAlbumRelationship,
    DbUser,
    database,
)


def up():
    with database:
        database.create_tables(
            [
                DbUser,
                DbPlaylist,
                DbAlbum,
                DbArtist,
                DbGenre,
                PlaylistAlbumRelationship,
                AlbumArtistRelationship,
                AlbumGenreRelationship,
            ]
        )


def down():
    with database:
        database.drop_tables(
            [
                DbUser,
                DbPlaylist,
                DbAlbum,
                DbArtist,
                DbGenre,
                PlaylistAlbumRelationship,
                AlbumArtistRelationship,
                AlbumGenreRelationship,
            ]
        )