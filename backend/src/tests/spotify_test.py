from typing import List

from src.dataclasses.playlist_track_object import PlaylistTrackObject
from src.dataclasses.track import Track
from src.spotify import get_playlist_duration, get_playlist_progress
from src.tests.mock_builders.playback_info_builder import playback_info_builder
from src.tests.mock_builders.track_builder import track_builder

mock_playlist_track_objects: List[PlaylistTrackObject] = [
    PlaylistTrackObject.model_validate(
        {
            "added_at": "02/04/2024",
            "added_by": None,
            "is_local": False,
            "track": track_builder(duration_ms=180000, track_number=1, id="1"),
        }
    ),
    PlaylistTrackObject.model_validate(
        {
            "added_at": "02/04/2024",
            "added_by": None,
            "is_local": False,
            "track": track_builder(duration_ms=240000, track_number=2, id="2"),
        }
    ),
    PlaylistTrackObject.model_validate(
        {
            "added_at": "02/04/2024",
            "added_by": None,
            "is_local": False,
            "track": track_builder(duration_ms=200000, track_number=3, id="3"),
        }
    ),
]


def test_get_playlist_progression():
    api_playback = playback_info_builder(track_id="2", track_progress=10000)

    progress = get_playlist_progress(api_playback, mock_playlist_track_objects)

    assert progress == 180000 + 10000


def test_get_playlist_duration():
    duration = get_playlist_duration(mock_playlist_track_objects)

    assert duration == 620000
