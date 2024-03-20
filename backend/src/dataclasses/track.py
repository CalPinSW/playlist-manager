from dataclasses import dataclass
from typing import List

from src.dataclasses.album import Album
from src.dataclasses.artist import Artist


@dataclass
class Track:
    album: Album
    artists: List[Artist]
    duration_ms: int
    id: str
    name: str
    popularity: int
    track_number: int
    uri: str
