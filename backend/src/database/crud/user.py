from src.database.models import DbAccessToken, DbUser
from src.dataclasses.user import User


def get_user_by_id(id: str):
    return DbUser.get_or_none(
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


def upsert_user_tokens(user_id: str, access_token: str, refresh_token: str, expires_in: int, token_type: str):
    DbAccessToken.insert(
        user=user_id, access_token=access_token, refresh_token=refresh_token, expires_in=expires_in, token_type=token_type
    ).on_conflict(
        conflict_target=[DbAccessToken.user],
        update={
            DbAccessToken.access_token: access_token,
            DbAccessToken.refresh_token: refresh_token,
            DbAccessToken.expires_in: expires_in,
            DbAccessToken.token_type: token_type,
        },
    ).execute()


def get_user_tokens(user_id: str) -> DbAccessToken:
    return DbAccessToken.get_or_none(DbAccessToken.user == user_id)


def get_user_by_auth0_id(auth0_id: str) -> DbUser:
    return DbUser.get_or_none(
        DbUser.auth0_id == auth0_id,
    )
