from typing import List, Optional
from pydantic import BaseModel
from src.dataclasses.artist import Artist
from src.dataclasses.external_urls import ExternalUrls
from src.dataclasses.linked_from import LinkedFrom
from src.dataclasses.restrictions import Restrictions


class SimplifiedTrack(BaseModel):
    artists: List[Artist]
    available_markets: List[str]
    disc_number: int
    duration_ms: int
    explicit: bool
    external_urls: ExternalUrls
    href: str
    id: str
    is_playable: Optional[bool] = None
    linked_from: Optional[LinkedFrom] = None
    restrictions: Optional[Restrictions] = None
    name: str
    preview_url: str
    track_number: int
    type: str
    uri: str
    is_local: bool
