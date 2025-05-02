from datetime import datetime
from src.database.models import (
    DbPlaybackState,
    PlaybackStateAlbumRelationship,
    DbAlbum,
    PlaybackStatePlaylistRelationship,
)
from peewee import DoesNotExist


def get_playback_state_for_album(album_id: str, user_id: str) -> DbPlaybackState | None:
    """
    Retrieve the playback state for a given album and user.

    Args:
        album_id (str): The ID of the album.
        user_id (str): The ID of the user.

    Returns:
        DbPlaybackState | None: The playback state if it exists, otherwise None.
    """
    try:
        # Find the relationship between the album and playback state
        relationship = PlaybackStateAlbumRelationship.get(
            (PlaybackStateAlbumRelationship.album == album_id)
            & (PlaybackStateAlbumRelationship.user == user_id)
        )
        # Return the associated playback state
        return relationship.playback_state
    except DoesNotExist:
        # Return None if no relationship exists
        return None


def upsert_playback_state_for_album(
    album_id: str,
    user_id: str,
    item_id: str,
    progress_ms: int,
    timestamp: datetime = datetime.now(),
):
    """
    Upsert (update or insert) a playback state for a given album and user.

    Args:
        album_id (str): The ID of the album.
        user_id (str): The ID of the user.
        item_id (str): The ID of the track associated with the playback state.
        progress_ms (int): The progress in milliseconds.
        timestamp (datetime, optional): The timestamp of the playback state. Defaults to now.

    Returns:
        DbPlaybackState: The upserted playback state.
    """
    try:
        # Check if a relationship already exists for the album and user
        relationship = PlaybackStateAlbumRelationship.get(
            (PlaybackStateAlbumRelationship.album == album_id)
            & (PlaybackStateAlbumRelationship.user == user_id)
        )

        # Update the existing playback state
        playback_state = relationship.playback_state
        playback_state.progress_ms = progress_ms
        playback_state.timestamp = timestamp
        playback_state.item = item_id
        playback_state.type = "album"
        playback_state.save()

    except DoesNotExist:
        # Create a new playback state
        playback_state = DbPlaybackState.create(
            progress_ms=progress_ms,
            timestamp=timestamp,
            item=item_id,
            type="album",
        )

        # Create a new relationship between the playback state, album, and user
        PlaybackStateAlbumRelationship.create(
            playback_state=playback_state,
            album=album_id,
            user=user_id,
        )

    return playback_state


def get_playback_state_for_playlist(playlist_id: str, user_id: str) -> DbPlaybackState | None:
    """
    Retrieve the playback state for a given playlist and user.

    Args:
        playlist_id (str): The ID of the playlist.
        user_id (str): The ID of the user.

    Returns:
        DbPlaybackState | None: The playback state if it exists, otherwise None.
    """
    try:
        # Find the relationship between the playlist and playback state
        relationship = PlaybackStatePlaylistRelationship.get(
            (PlaybackStatePlaylistRelationship.playlist == playlist_id)
            & (PlaybackStatePlaylistRelationship.user == user_id)
        )
        # Return the associated playback state
        return relationship.playback_state
    except DoesNotExist:
        # Return None if no relationship exists
        return None


def upsert_playback_state_for_playlist(
    playlist_id: str,
    user_id: str,
    item_id: str,
    progress_ms: int,
    timestamp: datetime = datetime.now(),
):
    """
    Upsert (update or insert) a playback state for a given playlist and user.

    Args:
        playlist_id (str): The ID of the playlist.
        user_id (str): The ID of the user.
        item_id (str): The ID of the track associated with the playback state.
        progress_ms (int): The progress in milliseconds.
        timestamp (datetime, optional): The timestamp of the playback state. Defaults to now.

    Returns:
        DbPlaybackState: The upserted playback state.
    """
    try:
        # Check if a relationship already exists for the playlist and user
        relationship = PlaybackStatePlaylistRelationship.get(
            (PlaybackStatePlaylistRelationship.playlist == playlist_id)
            & (PlaybackStatePlaylistRelationship.user == user_id)
        )

        # Update the existing playback state
        playback_state = relationship.playback_state
        playback_state.progress_ms = progress_ms
        playback_state.timestamp = timestamp
        playback_state.item = item_id
        playback_state.type = "playlist"
        playback_state.save()

    except DoesNotExist:
        # Create a new playback state
        playback_state = DbPlaybackState.create(
            progress_ms=progress_ms,
            timestamp=timestamp,
            item=item_id,
            type="playlist",
        )

        # Create a new relationship between the playback state, playlist, and user
        PlaybackStatePlaylistRelationship.create(
            playback_state=playback_state,
            playlist=playlist_id,
            user=user_id,
        )

    return playback_state
