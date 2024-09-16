from src.database.models import DbGenre


def create_genre(name: str):
    return DbGenre.get_or_create(name=name)
