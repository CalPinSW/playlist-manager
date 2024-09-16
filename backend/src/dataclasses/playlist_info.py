from pydantic import BaseModel
from typing import List, Optional

from src.dataclasses.image import Image
from src.dataclasses.track import Track


class PlaylistTrack(BaseModel):
    added_at: str
    track: Track


class PlaylistTracksContainer(BaseModel):
    total: int
    items: List[PlaylistTrack]


class PlaylistInfoTracks(BaseModel):
    total: int
    href: str


class SimplifiedPlaylist(BaseModel):
    id: str
    name: str
    description: str
    images: Optional[List[Image]] = None
    tracks: PlaylistInfoTracks
    snapshot_id: str


class CurrentUserPlaylists(BaseModel):
    href: str
    limit: int
    next: Optional[str]
    offset: int
    previous: Optional[str]
    total: int
    items: List[SimplifiedPlaylist]
