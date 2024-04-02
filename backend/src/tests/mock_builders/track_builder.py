from src.dataclasses.track import Track
from src.tests.mock_builders.album_builder import album_builder
from src.tests.mock_builders.artist_builder import artist_builder


def track_builder(
    id="1",
    name="artist 1",
    artists=[artist_builder()],
    album=album_builder(),
    track_number=1,
    duration_ms=180000,
):
    return Track.model_validate(
        {
            "album": album,
            "artists": artists,
            "available_markets": [],
            "disc_number": 1,
            "duration_ms": duration_ms,
            "explicit": False,
            "external_ids": None,
            "external_urls": {"spotify": "spotify_url"},
            "href": "href",
            "id": id,
            "is_playable": True,
            "restrictions": None,
            "name": name,
            "popularity": 50,
            "preview_url": "preview_url",
            "track_number": track_number,
            "type": "type",
            "uri": "uri",
            "is_local": False,
        }
    )
