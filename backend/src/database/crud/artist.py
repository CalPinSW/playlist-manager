from src.database.models import DbArtist
from src.dataclasses.artist import Artist


def create_or_update_artist(artist: Artist):
    db_artist, created = DbArtist.get_or_create(
        id=artist.id,
        defaults={
            "image_url": artist.images[0].url if artist.images else None,
            "name": artist.name,
            "uri": artist.uri,
        },
    )
    if not created:
        if artist.images:
            db_artist.image_url = artist.images[0].url
        db_artist.name = artist.name
        db_artist.uri = artist.uri
        db_artist.save()
    return db_artist
