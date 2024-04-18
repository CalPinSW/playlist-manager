from pydantic import BaseModel
from typing import List, Optional

from src.dataclasses.album import Album
from src.dataclasses.artist import Artist
from src.dataclasses.external_ids import ExternalIds
from src.dataclasses.external_urls import ExternalUrls
from src.dataclasses.restrictions import Restrictions


class Track(BaseModel):
    album: Album
    artists: List[Artist]
    available_markets: List[str]
    disc_number: int
    duration_ms: int
    explicit: bool
    external_ids: Optional[ExternalIds] = None
    external_urls: ExternalUrls
    href: str
    id: str
    is_playable: Optional[bool] = None
    restrictions: Optional[Restrictions] = None
    name: str
    popularity: int
    preview_url: Optional[str]
    track_number: int
    type: str
    uri: str
    is_local: bool
