from typing import Optional
from pydantic import BaseModel
from src.dataclasses.external_urls import ExternalUrls


class LinkedFrom(BaseModel):
    external_urls: Optional[ExternalUrls] = None
    href: Optional[str] = None
    id: Optional[str] = None
    type: Optional[str] = None
    uri: Optional[str] = None
