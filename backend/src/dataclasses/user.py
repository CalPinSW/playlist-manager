from pydantic import BaseModel
from typing import List, Optional

from src.dataclasses.explicit_content_info import ExplicitContent
from src.dataclasses.external_urls import ExternalUrls
from src.dataclasses.followers import Followers
from src.dataclasses.image import Image


class User(BaseModel):
    country: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[str] = None
    explicit_content: Optional[ExplicitContent] = None
    external_urls: ExternalUrls
    followers: Optional[Followers] = None
    href: Optional[str] = None
    id: str
    images: List[Image] = []
    product: Optional[str] = None
    type: str
    uri: str
