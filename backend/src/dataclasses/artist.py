from pydantic import BaseModel
from typing import List, Optional

from src.dataclasses.image import Image


class Artist(BaseModel):
    genres: Optional[List[str]] = None
    id: str
    images: Optional[List[Image]] = None
    name: str
    popularity: Optional[int] = None
    uri: str
