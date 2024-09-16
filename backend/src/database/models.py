from peewee import (
    PostgresqlDatabase,
    Model,
    CharField,
    IntegerField,
    DateField,
    ForeignKeyField,
)
from src.flask_config import Config

database = PostgresqlDatabase(Config().DB_CONNECTION_STRING)


class BaseModel(Model):
    class Meta:
        database = database


class DbUser(BaseModel):
    id = CharField(primary_key=True)
    display_name = CharField()
    image_url = CharField(max_length=400)
    uri = CharField()

    class Meta:
        db_table = "user"


class DbPlaylist(BaseModel):
    id = CharField(primary_key=True)
    description = CharField()
    image_url = CharField(null=True)
    name = CharField()
    user = ForeignKeyField(DbUser, backref="owner", to_field="id")
    snapshot_id = CharField()
    uri = CharField()

    class Meta:
        db_table = "playlist"


class DbAlbum(BaseModel):
    id = CharField(primary_key=True)
    album_type = CharField()
    total_tracks = IntegerField()
    image_url = CharField()
    name = CharField()
    release_date = DateField()
    release_date_precision = CharField()
    label = CharField(null=True)
    uri = CharField()

    class Meta:
        db_table = "album"


class DbArtist(BaseModel):
    id = CharField(primary_key=True)
    image_url = CharField(null=True)
    name = CharField()
    uri = CharField()

    class Meta:
        db_table = "artist"


class DbGenre(BaseModel):
    name = CharField(unique=True)

    class Meta:
        db_table = "genre"


class PlaylistAlbumRelationship(BaseModel):
    playlist = ForeignKeyField(DbPlaylist, backref="albums")
    album = ForeignKeyField(DbAlbum, backref="playlistsContaining")

    class Meta:
        indexes = ((("playlist", "album"), True),)


class AlbumArtistRelationship(BaseModel):
    album = ForeignKeyField(DbAlbum, backref="artists")
    artist = ForeignKeyField(DbArtist, backref="albums")

    class Meta:
        indexes = ((("album", "artist"), True),)


class AlbumGenreRelationship(BaseModel):
    album = ForeignKeyField(DbAlbum, backref="genres")
    genre = ForeignKeyField(DbGenre, backref="albums")

    class Meta:
        indexes = ((("album", "genre"), True),)
