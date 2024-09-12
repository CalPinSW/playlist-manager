from src.database.models import (
    DbTrack,
    TrackArtistRelationship,
    database,
)


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

