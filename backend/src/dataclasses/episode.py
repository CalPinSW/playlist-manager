from typing import List
from pydantic import BaseModel
from src.dataclasses.external_urls import ExternalUrls
from src.dataclasses.image import Image
from src.dataclasses.restrictions import Restrictions
from src.dataclasses.show import Show


class ResumePoint(BaseModel):
    fully_played: bool
    resume_position_ms: int


class Episode(BaseModel):
    audio_preview_url: str
    description: str
    html_description: str
    duration_ms: int
    explicit: bool
    external_urls: ExternalUrls
    href: str
    id: str
    images: List[Image]
    is_externally_hosted: bool
    is_playable: bool
    language: str
    languages: List[str]
    name: str
    release_date: str
    release_date_precision: str
    resume_point: ResumePoint
    type: str
    uri: str
    restrictions: Restrictions
    show: Show
    href: str
    id: str
    images: List[Image]
    is_externally_hosted: bool
    languages: List[str]
    media_type: str
    name: str
    publisher: str
    type: str
    uri: str
    total_episodes: int
