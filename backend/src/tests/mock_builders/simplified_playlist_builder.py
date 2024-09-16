from src.dataclasses.playlist_info import SimplifiedPlaylist
from src.tests.mock_builders.image_builder import image_builder
from src.tests.mock_builders.playlist_info_tracks_builder import (
    playlist_info_tracks_builder,
)


def simplified_playlist_builder(
    id="1",
    name="Playlist 1",
    description="",
    images=[image_builder()],
    tracks=playlist_info_tracks_builder(),
    snapshot_id="snapshot1",
):
    return SimplifiedPlaylist.model_validate(
        {
            "id": id,
            "name": name,
            "description": description,
            "images": images,
            "tracks": tracks,
            "snapshot_id": snapshot_id,
        }
    )
