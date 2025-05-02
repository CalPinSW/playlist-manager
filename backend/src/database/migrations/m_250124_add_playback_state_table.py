from src.database.migrations.setup import database
from src.database.models import (
    DbPlaybackState,
    PlaybackStateAlbumRelationship,
    PlaybackStatePlaylistRelationship,
)


def up():
    with database:
        database.create_tables(
            [
                DbPlaybackState,
                PlaybackStateAlbumRelationship,
                PlaybackStatePlaylistRelationship,
            ]
        )


def down():
    with database:
        database.drop_tables(
            [
                DbPlaybackState,
                PlaybackStateAlbumRelationship,
                PlaybackStatePlaylistRelationship,
            ]
        )
