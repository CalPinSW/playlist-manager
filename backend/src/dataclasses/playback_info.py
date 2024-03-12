from dataclasses import dataclass
from typing import List, Optional
from src.text_formatting import format_ms_as_mins_and_secs


@dataclass
class PlaylistProgression:
    playlist_id: str
    playlist_title: str
    playlist_progress: float
    playlist_duration: float


@dataclass
class PlaybackInfo:
    track_title: str
    track_id: str
    album_title: str
    playlist_id: Optional[str]
    track_artists: List[str]
    album_artists: List[str]
    artwork_url: str
    track_progress: float
    track_duration: float
    album_progress: float
    album_duration: float

    def get_formatted_artists(self) -> str:
        return ", ".join(self.track_artists)

    def get_formatted_track_progress(self) -> str:
        return (
            format_ms_as_mins_and_secs(self.track_progress)
            + " / "
            + format_ms_as_mins_and_secs(self.track_duration)
        )

    def get_formatted_album_progress(self) -> str:
        return (
            format_ms_as_mins_and_secs(self.album_progress)
            + " / "
            + format_ms_as_mins_and_secs(self.album_duration)
            + f" ({(100*self.album_progress/self.album_duration):02.0f}%)"
        )
