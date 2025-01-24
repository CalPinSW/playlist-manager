from src.database.migrations.setup import database
from src.database.models import DbAlbumNote


def up():
    with database:
        database.create_tables(
            [
                DbAlbumNote,
            ]
        )


def down():
    with database:
        database.drop_tables(
            [
                DbAlbumNote,
            ]
        )
