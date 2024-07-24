from pydantic import BaseModel
from typing import List, Optional


class StartPlaybackRequestPositionOffset(BaseModel):
    position: int


class StartPlaybackRequestUriOffset(BaseModel):
    uri: str


class StartPlaybackRequest(BaseModel):
    context_uri: Optional[str] = None
    uris: Optional[List[str]] = None
    offset: Optional[
        StartPlaybackRequestPositionOffset | StartPlaybackRequestUriOffset
    ] = None
    position_ms: Optional[int] = None
