from pydantic import BaseModel
from src.dataclasses.external_urls import ExternalUrls


class LinkedFrom(BaseModel):     
    external_urls: ExternalUrls
    href: str
    id: str
    type: str
    uri: str
