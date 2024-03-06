from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Album:
    artists: List[str]
    title: str
    release_date: Optional[str] = None
    score: Optional[int] = None
    genres: List[str] = field(default_factory=list)
    summary: Optional[str] = None

    def get_formatted_artists(self) -> str:
        return ", ".join(self.artists)
