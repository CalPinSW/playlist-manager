from src.database.models import DbUser
from src.dataclasses.user import User


def get_user_by_id(id: str):
    return DbUser.get(
        DbUser.id == id,
    )


def create_user(user: User):
    return DbUser.create(
        id=user.id,
        display_name=user.display_name,
        image_url=user.images[-1].url,
        uri=user.uri,
    )


def get_or_create_user(user: User):
    return DbUser.get_or_create(
        id=user.id,
        defaults={
            "display_name": user.display_name,
            "image_url": user.images[-1].url,
            "uri": user.uri,
        },
    )
