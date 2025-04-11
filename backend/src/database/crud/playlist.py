from logging import Logger
from typing import List, Optional
from src.database.crud.album import get_or_create_album
from src.database.crud.track import create_track_or_none
from src.database.models import (
    AlbumArtistRelationship,
    AlbumGenreRelationship,
    DbAlbum,
    DbArtist,
    DbGenre,
    DbPlaylist,
    DbTrack,
    DbUser,
    PlaylistAlbumRelationship,
    TrackArtistRelationship,
)
from src.dataclasses.playlist import Playlist
from peewee import fn, prefetch


def get_playlist_by_id_or_none(id: str):
    return DbPlaylist.get_or_none(DbPlaylist.id == id)


def create_playlist(playlist: Playlist, user: DbUser):
    db_playlist = DbPlaylist.create(
        id=playlist.id,
        description=playlist.description,
        image_url=playlist.images[0].url if playlist.images else None,
        name=playlist.name,
        user=user.id,
        snapshot_id=playlist.snapshot_id,
        uri=playlist.uri,
    )

    album_index = 0
    for track in playlist.tracks.items:
        db_album = get_or_create_album(track.track.album, ignore_tracks=True)
        if PlaylistAlbumRelationship.get_or_create(
            playlist=db_playlist,
            album=db_album,
            defaults={"album_index": album_index},
        )[1]:
            album_index += 1
        create_track_or_none(track.track)
    return db_playlist


def delete_playlist(playlist_id: str):
    query = PlaylistAlbumRelationship.delete().where(
        PlaylistAlbumRelationship.playlist == playlist_id
    )
    query.execute()
    DbPlaylist.delete_by_id(playlist_id)


def update_playlist_info(
    id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    snapshot_id: Optional[str] = None,
    uri: Optional[str] = None,
) -> DbPlaylist | None:
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if snapshot_id is not None:
        update_data["snapshot_id"] = snapshot_id
    if uri is not None:
        update_data["uri"] = uri

    if update_data:
        query = DbPlaylist.update(update_data).where(DbPlaylist.id == id)
        query.execute()

        updated_playlist = DbPlaylist.get_by_id(id)
        return updated_playlist

    return None


def get_user_playlists(
    user_id: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    desc: bool = True,
    as_dicts: bool = False,
) -> List[DbPlaylist]:
    query = DbPlaylist.select().where(DbPlaylist.user == user_id)

    if search:
        query = query.where(DbPlaylist.name.contains(search))

    if sort_by:
        sort_field = getattr(DbPlaylist, sort_by)
        if desc:
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())

    if limit is not None:
        query = query.limit(limit)
    if offset is not None:
        query = query.offset(offset)

    if as_dicts:
        return list(query.dicts())
    else:
        return list(query.execute())


def get_recent_user_playlists(
    user_id: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    search: Optional[str] = None,
) -> List[DbPlaylist]:

    # Use TO_DATE function in PostgreSQL to convert the extracted date into a proper date
    query = (
        DbPlaylist.select()
        .where(
            (
                DbPlaylist.name.startswith("New Albums")
                | DbPlaylist.name.startswith("Best Albums")
            )
        )
        # Convert the date string into a proper date format for ordering
        .order_by(fn.TO_DATE(fn.RIGHT(DbPlaylist.name, 8), "DD/MM/YY").desc())
        .limit(limit)
        .offset(offset)
    )

    if search:
        query = query.where(DbPlaylist.name.contains(search))

    playlists = []
    for playlist in query:
        # Add playlist to the result with parsed date
        playlists.append(
            {
                "id": playlist.id,
                "name": playlist.name,
                "description": playlist.description,
                "image_url": playlist.image_url,
                "user_id": playlist.user.id,
                "snapshot_id": playlist.snapshot_id,
                "uri": playlist.uri,
            }
        )
    return playlists


def search_playlists_by_albums(
    user_id: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    desc: bool = True,
    as_dicts: bool = False,
) -> List[DbPlaylist]:
    # Subquery to find albums where the album name or artist name contains the search query
    albums_with_artists_query = (
        DbAlbum.select(DbAlbum.id).join(AlbumArtistRelationship).join(DbArtist)
    )

    if search:
        albums_with_artists_query = albums_with_artists_query.where(
            (DbAlbum.name.contains(search)) | (DbArtist.name.contains(search))
        )

    # Query to find playlists containing the matching albums
    playlists_with_albums_query = (
        DbPlaylist.select(DbPlaylist)
        .join(PlaylistAlbumRelationship)
        .join(DbAlbum)
        .where(DbAlbum.id.in_(albums_with_artists_query))
    )

    if sort_by:
        sort_field = getattr(DbPlaylist, sort_by)
        if desc:
            playlists_with_albums_query = playlists_with_albums_query.order_by(
                sort_field.desc()
            )
        else:
            playlists_with_albums_query = playlists_with_albums_query.order_by(
                sort_field.asc()
            )

    if limit is not None:
        playlists_with_albums_query = playlists_with_albums_query.limit(limit)
    if offset is not None:
        playlists_with_albums_query = playlists_with_albums_query.offset(offset)

    if as_dicts:
        return list(playlists_with_albums_query.dicts())
    else:
        return list(playlists_with_albums_query.execute())


def get_playlist_albums(playlist_id: str) -> List[DbAlbum]:
    query = (
        DbAlbum.select()
        .join(PlaylistAlbumRelationship)
        .join(DbPlaylist)
        .where(DbPlaylist.id == playlist_id)
    )
    return list(query)


def get_playlist_albums_with_genres(playlist_id: str) -> List[dict]:
    albums_query = (
        DbAlbum.select(DbAlbum.id, DbAlbum.name, DbAlbum.image_url)
        .join(
            PlaylistAlbumRelationship,
            on=(PlaylistAlbumRelationship.album == DbAlbum.id),
        )
        .join(DbPlaylist, on=(PlaylistAlbumRelationship.playlist == DbPlaylist.id))
        .where(DbPlaylist.id == playlist_id)
        .order_by(PlaylistAlbumRelationship.album_index.asc())
    )

    albums_with_genres_and_artists = prefetch(
        albums_query, AlbumGenreRelationship, DbGenre, AlbumArtistRelationship, DbArtist
    )

    albums_with_details = []
    for album in albums_with_genres_and_artists:
        genres = [genre_rel.genre.name for genre_rel in album.genres]
        artists = [{"name": artist_rel.artist.name} for artist_rel in album.artists]

        album_details = {
            "id": album.id,
            "name": album.name,
            "image_url": album.image_url,
            "genres": genres,
            "artists": artists,
        }

        albums_with_details.append(album_details)

    return albums_with_details


def add_playlist_album_index(album_id: str, playlist_id: str, index: int):
    query = PlaylistAlbumRelationship.update(album_index=index).where(
        PlaylistAlbumRelationship.album == album_id,
        PlaylistAlbumRelationship.playlist == playlist_id,
    )
    query.execute()


def playlist_has_null_album_indexes(playlist_id: str):
    query = PlaylistAlbumRelationship.select().where(
        (PlaylistAlbumRelationship.playlist_id == playlist_id)
        & (PlaylistAlbumRelationship.album_index.is_null(True))
    )

    return query.exists()


def get_playlist_track_list(playlist_id: str):
    query = (
        DbTrack.select(
            DbTrack.name,
            DbTrack.id,
            DbAlbum.name,
            PlaylistAlbumRelationship.album_index,
        )
        .join(DbAlbum)
        .join(
            PlaylistAlbumRelationship,
            on=(DbTrack.album == PlaylistAlbumRelationship.album),
        )
        .where(PlaylistAlbumRelationship.playlist == playlist_id)
        .order_by(
            PlaylistAlbumRelationship.album_index,
            DbTrack.disc_number,
            DbTrack.track_number,
        )
    )

    tracks_with_artists = prefetch(query, TrackArtistRelationship, DbArtist)

    result = []
    for track in tracks_with_artists:
        artists = [{"name": rel.artist.name for rel in track.artists}]
        result.append(
            {
                "id": track.id,
                "name": track.name,
                "album": {
                    "name": track.album.name,
                },
                "artists": artists,
            }
        )

    return result


def get_playlist_duration(playlist_id):
    # Subquery to get all albums associated with the playlist
    albums_in_playlist = PlaylistAlbumRelationship.select(
        PlaylistAlbumRelationship.album
    ).where(PlaylistAlbumRelationship.playlist == playlist_id)

    # Query to sum the duration of all tracks in the albums from the playlist
    total_duration = (
        DbTrack.select(fn.SUM(DbTrack.duration_ms))
        .where(DbTrack.album.in_(albums_in_playlist))
        .scalar()
    )  # .scalar() to get the result directly as a number

    # If no tracks are found, return 0
    return total_duration or 0


def get_playlist_duration_up_to_track(playlist_id, track_id):
    # Query to get all tracks in the albums of the playlist, with proper joins and ordering
    tracks_in_playlist = (
        DbTrack.select(DbTrack.id, DbTrack.duration_ms)
        .join(DbAlbum, on=(DbTrack.album == DbAlbum.id))  # Join track with album
        .join(
            PlaylistAlbumRelationship,
            on=(DbTrack.album == PlaylistAlbumRelationship.album),
        )  # Join to get album_index
        .where(
            PlaylistAlbumRelationship.playlist == playlist_id
        )  # Ensure we're only querying tracks in the specific playlist
        .order_by(
            PlaylistAlbumRelationship.album_index,
            DbTrack.disc_number,
            DbTrack.track_number,
        )
    )

    # Variable to accumulate total duration
    total_duration = 0

    # Loop through tracks and sum duration until we reach the given track_id
    for track in tracks_in_playlist:
        total_duration += track.duration_ms
        if track.id == track_id:
            break
    return total_duration


def search_playlist_names(user_id: str, search: str) -> List[dict]:
    # Query playlists where name ends with the given date_str
    playlists = (
        DbPlaylist.select(
            DbPlaylist.id, DbPlaylist.name, DbPlaylist.description, DbPlaylist.image_url
        )
        .where(DbPlaylist.name.contains(search))
        .where(DbPlaylist.user_id == user_id)
        .execute()
    )

    # Build a list of playlist details
    result = [
        {
            "id": playlist.id,
            "name": playlist.name,
            "description": playlist.description,
            "image_url": playlist.image_url,
        }
        for playlist in playlists
    ]

    return result


def create_playlist_album_relationship(playlist_id: str, album_id: str):
    max_album_index = (
        PlaylistAlbumRelationship.select(fn.MAX(PlaylistAlbumRelationship.album_index))
        .where(PlaylistAlbumRelationship.playlist == playlist_id)
        .scalar()
    )
    result = PlaylistAlbumRelationship.create(
        playlist=playlist_id, album=album_id, album_index=max_album_index + 1
    )
    return result
