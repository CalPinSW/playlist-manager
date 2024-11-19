from src.database.models import (
    DbTrack,
    TrackArtistRelationship,
)
from src.database.migrations.setup import database


def up():
    with database:
        database.create_tables(
            [
                DbTrack,
                TrackArtistRelationship,
            ]
        )


def down():
    with database:
        database.drop_tables(
            [
                DbTrack,
                TrackArtistRelationship,
            ]
        )

