from src.database.models import DbAccessToken, db_wrapper


def up():
    with db_wrapper.database:
        db_wrapper.database.create_tables(
            [
                DbAccessToken,
            ]
        )


def down():
    with db_wrapper.database:
        db_wrapper.database.drop_tables(
            [
                DbAccessToken,
            ]
        )
