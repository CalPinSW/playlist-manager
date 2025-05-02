from pydantic import BaseModel
from typing import List, Literal, Optional, Union


class Offset(BaseModel):
    type: Literal["position", "uri", "album_id"]


class PositionOffset(Offset):
    type: Literal["position"] = "position"
    position: int


class UriOffset(Offset):
    type: Literal["uri"] = "uri"
    uri: str


class AlbumIdOffset(Offset):
    type: Literal["album_id"] = "album_id"
    album_id: str


class StartPlaybackRequest(BaseModel):
    context_uri: Optional[str] = None
    uris: Optional[List[str]] = None
    offset: Optional[Union[PositionOffset, UriOffset, AlbumIdOffset]] = None
    position_ms: Optional[int] = None


class ResumePlaybackRequest(BaseModel):
    id: str
    context_uri: Optional[str] = None
