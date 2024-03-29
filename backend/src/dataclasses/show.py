from typing import List
from pydantic import BaseModel
from src.dataclasses.external_urls import ExternalUrls


class Copyright(BaseModel):
    text: str
    type: str


class Show(BaseModel):
    available_markets: List[str]
    copyrights: List[Copyright]
    description: str
    html_description: str
    explicit: bool
    external_urls: ExternalUrls
