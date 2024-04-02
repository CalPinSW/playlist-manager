from src.dataclasses.simplified_track import SimplifiedTrack
from src.tests.mock_builders.artist_builder import artist_builder


def simplified_track_builder(
    id="1",
    name="artist 1",
    artists=[artist_builder()],
    track_number=1,
    duration_ms=180000,
):
    return SimplifiedTrack.model_validate(
        {
            "artists": artists,
            "available_markets": [],
            "disc_number": 1,
            "duration_ms": duration_ms,
            "explicit": False,
            "external_urls": {"spotify": "spotify_url"},
            "href": "href",
            "id": id,
            "is_playable": True,
            "linked_from": None,
            "restrictions": None,
            "name": name,
            "preview_url": "preview_url",
            "track_number": track_number,
            "type": "type",
            "uri": "uri",
            "is_local": False,
        }
    )
