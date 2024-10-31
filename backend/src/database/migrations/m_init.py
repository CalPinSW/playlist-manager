from src.database.models import (
    DbAlbum,
    AlbumArtistRelationship,
    AlbumGenreRelationship,
    DbArtist,
    DbGenre,
    DbPlaylist,
    PlaylistAlbumRelationship,
    DbUser,
    db_wrapper,
)


def up():
    with db_wrapper.database:
        db_wrapper.database.create_tables(
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
    with db_wrapper.database:
        db_wrapper.database.drop_tables(
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
