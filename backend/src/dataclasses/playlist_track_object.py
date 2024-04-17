from typing import Optional
from pydantic import BaseModel
from src.dataclasses.playback_state import Episode
from src.dataclasses.track import Track
from src.dataclasses.user import User


class PlaylistTrackObject(BaseModel):
    added_at: str
    added_by: Optional[User] = None
    is_local: bool
    track: Track | Episode
