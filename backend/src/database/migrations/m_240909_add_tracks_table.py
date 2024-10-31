from src.database.models import (
    DbTrack,
    TrackArtistRelationship,
    db_wrapper,
)


def up():
    with db_wrapper.database:
        db_wrapper.database.create_tables(
            [
                DbTrack,
                TrackArtistRelationship,
            ]
        )


def down():
    with db_wrapper.database:
        db_wrapper.database.drop_tables(
            [
                DbTrack,
                TrackArtistRelationship,
            ]
        )

