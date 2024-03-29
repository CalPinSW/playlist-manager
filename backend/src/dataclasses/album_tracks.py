from typing import List, Optional
from pydantic import BaseModel
from src.dataclasses.simplified_track import SimplifiedTrack


class AlbumTracks(BaseModel):
    href: str
    limit: int
    next: Optional[str]
    offset: int
    previous: Optional[str] = None
    total: int
    items: List[SimplifiedTrack]
