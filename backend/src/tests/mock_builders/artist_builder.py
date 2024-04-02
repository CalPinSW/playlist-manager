from src.dataclasses.artist import Artist
from src.tests.mock_builders.image_builder import image_builder


def artist_builder(
    id="1",
    name="artist 1",
    images=[image_builder()],
):
    return Artist.model_validate(
        {
            "genres": None,
            "id": id,
            "name": name,
            "images": images,
            "popularity": None,
            "uri": "uri 1",
        }
    )
