from src.dataclasses.album import Album
from src.tests.mock_builders.album_tracks_builder import album_tracks_builder
from src.tests.mock_builders.artist_builder import artist_builder
from src.tests.mock_builders.image_builder import image_builder


def album_builder(
    id="1",
    name="artist 1",
    images=[image_builder()],
    artists=[artist_builder()],
    album_tracks=album_tracks_builder(),
):
    return Album.model_validate(
        {
            "album_type": "Album",
            "total_tracks": len(album_tracks.items),
            "available_markets": [],
            "external_urls": {"spotify": "SpotifyUrl"},
            "href": "href",
            "id": id,
            "images": images,
            "name": name,
            "release_date": "02/04/24",
            "release_date_precision": "day",
            "restrictions": None,
            "type": "type",
            "uri": "uri",
            "artists": artists,
            "tracks": album_tracks,
            "copyrights": None,
            "external_ids": None,
            "genres": [],
            "label": None,
            "popularity": None,
        }
    )
