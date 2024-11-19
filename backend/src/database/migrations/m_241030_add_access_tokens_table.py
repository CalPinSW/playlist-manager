from src.database.models import DbAccessToken
from src.database.migrations.setup import database


def up():
    with database:
        database.create_tables(
            [
                DbAccessToken,
            ]
        )


def down():
    with database:
        database.drop_tables(
            [
                DbAccessToken,
            ]
        )
