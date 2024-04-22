from typing import List, Optional
from pydantic import BaseModel
from src.dataclasses.playlist_track_object import PlaylistTrackObject


class PlaylistTracks(BaseModel):
    href: str
    limit: int
    next: Optional[str] = None
    offset: int
    previous: Optional[str] = None
    total: int
    items: List[PlaylistTrackObject]
