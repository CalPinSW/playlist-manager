from peewee import (
    AutoField,
    CharField,
    IntegerField,
    BigIntegerField,
    DateField,
    ForeignKeyField,
    BooleanField,
)
from playhouse.flask_utils import FlaskDB

db_wrapper = FlaskDB()


class DbUser(db_wrapper.Model):
    id = CharField(primary_key=True)
    display_name = CharField()
    image_url = CharField(max_length=400)
    auth0_id = CharField(unique=True)
    uri = CharField()

    class Meta:
        db_table = "user"


class DbPlaylist(db_wrapper.Model):
    id = CharField(primary_key=True)
    description = CharField()
    image_url = CharField(null=True)
    name = CharField()
    user = ForeignKeyField(DbUser, backref="owner", on_delete="CASCADE")
    snapshot_id = CharField()
    uri = CharField()

    class Meta:
        db_table = "playlist"


class DbAlbum(db_wrapper.Model):
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


class DbArtist(db_wrapper.Model):
    id = CharField(primary_key=True)
    image_url = CharField(null=True)
    name = CharField()
    uri = CharField()

    class Meta:
        db_table = "artist"


class DbGenre(db_wrapper.Model):
    name = CharField(unique=True)

    class Meta:
        db_table = "genre"


class DbTrack(db_wrapper.Model):
    id = CharField(primary_key=True)
    name = CharField()
    album = ForeignKeyField(DbAlbum, backref="album", on_delete="CASCADE")
    disc_number = IntegerField()
    track_number = IntegerField()
    duration_ms = IntegerField()
    uri = CharField()

    class Meta:
        db_table = "track"


class PlaylistAlbumRelationship(db_wrapper.Model):
    playlist = ForeignKeyField(DbPlaylist, backref="albums", on_delete="CASCADE")
    album = ForeignKeyField(DbAlbum, backref="playlistsContaining", on_delete="CASCADE")
    album_index = IntegerField(null=True)  # New column added

    class Meta:
        indexes = (
            (("playlist", "album"), True),
            (("playlist", "albumIndex"), True),
        )


class AlbumArtistRelationship(db_wrapper.Model):
    album = ForeignKeyField(DbAlbum, backref="artists", on_delete="CASCADE")
    artist = ForeignKeyField(DbArtist, backref="albums", on_delete="CASCADE")

    class Meta:
        indexes = ((("album", "artist"), True),)


class AlbumGenreRelationship(db_wrapper.Model):
    album = ForeignKeyField(DbAlbum, backref="genres", on_delete="CASCADE")
    genre = ForeignKeyField(DbGenre, backref="albums", on_delete="CASCADE")

    class Meta:
        indexes = ((("album", "genre"), True),)


class TrackArtistRelationship(db_wrapper.Model):
    track = ForeignKeyField(DbTrack, backref="artists", on_delete="CASCADE")
    artist = ForeignKeyField(DbArtist, backref="tracks", on_delete="CASCADE")

    class Meta:
        indexes = ((("track", "artist"), True),)


class DbAccessToken(db_wrapper.Model):
    user = ForeignKeyField(DbUser, backref="owner", on_delete="CASCADE", unique=True)
    access_token = CharField(max_length=400, null=True)
    refresh_token = CharField(max_length=200, null=True)
    expires_in = IntegerField(null=True)
    token_type = CharField(max_length=50, null=True)

    class Meta:
        db_table = "access_token"


class DbAlbumNote(db_wrapper.Model):
    id = CharField(primary_key=True)
    text = CharField()
    album = ForeignKeyField(DbAlbum, backref="album", on_delete="CASCADE")

    class Meta:
        db_table = "album_notes"


class DbPlaybackState(db_wrapper.Model):
    id = AutoField(primary_key=True)
    item = ForeignKeyField(DbTrack, backref="track", on_delete="CASCADE", null=True)
    progress_ms = BigIntegerField(null=True)
    timestamp = DateField()
    type = CharField()

    class Meta:
        db_table = "playback_state"


class PlaybackStateAlbumRelationship(db_wrapper.Model):
    playback_state = ForeignKeyField(
        DbPlaybackState, backref="playback_state", on_delete="CASCADE"
    )
    album = ForeignKeyField(DbAlbum, backref="playback_state", on_delete="CASCADE")
    user = ForeignKeyField(DbUser, backref="playback_state", on_delete="CASCADE")

    class Meta:
        indexes = ((("playback_state", "album", "user"), True),)


class PlaybackStatePlaylistRelationship(db_wrapper.Model):
    playback_state = ForeignKeyField(
        DbPlaybackState, backref="playback_state", on_delete="CASCADE"
    )
    playlist = ForeignKeyField(
        DbPlaylist, backref="playback_state", on_delete="CASCADE"
    )
    user = ForeignKeyField(DbUser, backref="playback_state", on_delete="CASCADE")

    class Meta:
        indexes = ((("playback_state", "playlist", "user"), True),)
