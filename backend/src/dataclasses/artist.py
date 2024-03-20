from dataclasses import dataclass
from typing import List

from src.dataclasses.image import Image


@dataclass
class Artist:
    genres: List[str]
    id: str
    images: List[Image]
    name: str
    popularity: int
    uri: str
