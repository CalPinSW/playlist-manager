from src.dataclasses.album_tracks import AlbumTracks
from src.tests.mock_builders.simplified_track_builder import simplified_track_builder


def album_tracks_builder(items=[simplified_track_builder()]):

    return AlbumTracks.model_validate(
        {
            "href": "href",
            "limit": 50,
            "next": None,
            "offset": 0,
            "previous": None,
            "total": len(items),
            "items": items,
        }
    )
