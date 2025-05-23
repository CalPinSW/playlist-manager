from src.dataclasses.playback_info import PlaybackInfo


def playback_info_builder(
    track_id="1",
    album_id="1",
    playlist_id="1",
    track_artists=[],
    album_artists=[],
    track_progress=10000,
    track_duration=180000,
    album_progress=1000000,
    album_duration=18000000,
    is_playing=True,
):
    return PlaybackInfo.model_validate(
        {
            "type": "track",
            "track_title": "track title",
            "track_id": track_id,
            "album_id": album_id,
            "album_title": "album title",
            "playlist_id": playlist_id,
            "track_artists": track_artists,
            "album_artists": album_artists,
            "artwork_url": "artwork_url",
            "track_progress": track_progress,
            "track_duration": track_duration,
            "album_progress": album_progress,
            "album_duration": album_duration,
            "is_playing": is_playing,
        }
    )
