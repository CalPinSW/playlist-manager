from src.dataclasses.playlist_info import CurrentUserPlaylists
from src.tests.mock_builders.image_builder import image_builder
from src.tests.mock_builders.simplified_playlist_builder import (
    simplified_playlist_builder,
)


def current_user_playlists_builder(
    limit=50,
    offset=0,
    total=50,
    items=[simplified_playlist_builder()],
):
    return CurrentUserPlaylists.model_validate(
        {
            "href": "href",
            "limit": limit,
            "next": None,
            "offset": offset,
            "previous": None,
            "total": total,
            "items": items,
        }
    )
