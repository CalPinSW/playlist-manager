from src.dataclasses.playlist_info import PlaylistInfoTracks, SimplifiedPlaylist
from src.tests.mock_builders.image_builder import image_builder


def playlist_info_tracks_builder(total=20):
    return PlaylistInfoTracks.model_validate({"total": total, "href": "href"})
