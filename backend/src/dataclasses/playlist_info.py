from dataclasses import dataclass
from typing import List

from src.dataclasses.album import Album
from src.dataclasses.image import Image
from src.dataclasses.track import Track


@dataclass
class PlaylistTrack:
    added_at: str
    track: Track

@dataclass
class PlaylistTracksContainer:
    total: int
    items: List[PlaylistTrack]


@dataclass
class PlaylistInfo:
    id: str
    name: str
    description: str
    images: List[Image]
    tracks: List[Track]
