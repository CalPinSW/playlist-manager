from pydantic import BaseModel
from src.dataclasses.album_tracks import AlbumTracks
from src.dataclasses.artist import Artist
from src.dataclasses.external_ids import ExternalIds
from src.dataclasses.external_urls import ExternalUrls
from src.dataclasses.image import Image
from src.dataclasses.restrictions import Restrictions
from src.dataclasses.show import Copyright
from typing import List, Optional


class Album(BaseModel):
    album_type: str
    total_tracks: int
    available_markets: List[str]
    external_urls: ExternalUrls
    href: str
    id: str
    images: List[Image]
    name: str
    release_date: str
    release_date_precision: str
    restrictions: Optional[Restrictions] = None
    type: str
    uri: str
    artists: List[Artist]
    tracks: Optional[AlbumTracks] = None
    copyrights: Optional[List[Copyright]] = None
    external_ids: Optional[ExternalIds] = None
    genres: Optional[List[str]] = None
    label: Optional[str] = None
    popularity: Optional[int] = None

    def get_formatted_artists(self) -> str:
        return ", ".join(self.artists)
