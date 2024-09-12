from typing import List
from src.database.crud.artist import create_or_update_artist
from src.dataclasses.simplified_track import SimplifiedTrack
from src.database.models import (
    DbAlbum,
    DbArtist,
    DbPlaylist,
    PlaylistAlbumRelationship,
    TrackArtistRelationship,
    DbTrack,
)
from peewee import JOIN, fn
from playhouse.shortcuts import model_to_dict


def create_track_or_none(track: SimplifiedTrack, album: DbAlbum):

    for artist in track.artists:
        create_or_update_artist(artist)
        TrackArtistRelationship.get_or_create(track=track.id, artist=artist.id)


def add_track_artists(track: SimplifiedTrack):
    for artist in track.artists:
        create_or_update_artist(artist)
        TrackArtistRelationship.create(track=track.id, artist=artist.id)


def get_album_tracks(album: DbAlbum) -> List[DbTrack] | None:
    query = (
        DbTrack.select(DbTrack, DbArtist)
        .join(
            TrackArtistRelationship,
            on=(TrackArtistRelationship.track == DbTrack.id),
        )
        .join(DbArtist, on=(TrackArtistRelationship.artist == DbArtist.id))
        .where(DbTrack.album == album.id)
    )

    results = []
    for track in query:
        track_dict = model_to_dict(track, recurse=False)
        artist_dict = model_to_dict(track.artists, recurse=False)

        # Adding the album and artist information to the track
        track_dict["artists"] = artist_dict

        results.append(track_dict)

    # Returning the results as JSON
    return results


def get_user_albums_with_no_tracks(user_id: str) -> List[DbAlbum]:
    query = (
        DbAlbum.select()
        .join(PlaylistAlbumRelationship)
        .join(DbPlaylist)
        .join(DbTrack, JOIN.LEFT_OUTER, on=(DbAlbum.id == DbTrack.album_id))
        .where(DbPlaylist.user == user_id)
        .where(DbTrack.album_id.is_null(True))
    )
    return list(query)


def all_tracks_have_artists(album_id):
    # Count the total number of tracks for the given album
    total_tracks = (
        DbTrack.select(fn.COUNT(DbTrack.id)).where(DbTrack.album == album_id).scalar()
    )  # Fetches the total count of tracks in the album

    # Count the number of distinct tracks in TrackArtistRelationship for the given album
    tracks_with_artists = (
        TrackArtistRelationship.select(
            fn.COUNT(fn.DISTINCT(TrackArtistRelationship.track))
        )
        .join(DbTrack, on=(TrackArtistRelationship.track == DbTrack.id))
        .where(DbTrack.album == album_id)
        .scalar()
    )  # Fetches the count of unique tracks with artists

    # Return True if all tracks have at least one artist, False otherwise
    return total_tracks == tracks_with_artists
