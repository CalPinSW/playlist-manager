from pydantic import BaseModel
from typing import List

from src.dataclasses.followers import Followers

from src.dataclasses.external_urls import ExternalUrls
from src.dataclasses.image import Image
from src.dataclasses.playlist_tracks import PlaylistTracks
from src.dataclasses.user import User


class Playlist(BaseModel):
    collaborative: bool
    description: str
    external_urls: ExternalUrls
    followers: Followers
    href: str
    id: str
    images: List[Image]
    name: str
    owner: User
    public: bool
    snapshot_id: str
    tracks: PlaylistTracks
    type: str
    uri: str
