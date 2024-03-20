from dataclasses import dataclass

from src.dataclasses.album import Album
from src.dataclasses.track import Track


@dataclass
class PlaybackContext:
    type: str
    uri: str


@dataclass
class Episode:
    id: str


@dataclass
class ApiPlaybackInfo:
    context: PlaybackContext
    progress_ms: int
    is_playing: bool
    item: Track | Episode
    device: any
    shuffle_state: any
    smart_shuffle: any
    repeat_state: any
    timestamp: str
    currently_playing_type: str
    actions: any
