from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ValidationInfo, field_validator
from src.dataclasses.artist import Artist
from src.dataclasses.device import Device
from src.dataclasses.image import Image
from src.dataclasses.track import Track


class PlaybackContext(BaseModel):
    type: Literal["artist", "playlist", "album", "show"]
    uri: str


class Podcast(BaseModel):
    id: str
    name: str
    publisher: str
    description: str
    images: Optional[List[Image]] = None
    total_episodes: int
    uri: str

    model_config = {
        "extra": "allow",  # Allow extra fields in the input data
    }


class Episode(BaseModel):
    id: str
    name: str
    images: Optional[List[Image]] = None
    show: Podcast
    model_config = {
        "extra": "allow",  # Allow extra fields in the input data
    }


class PlaybackActions(BaseModel):
    interrupting_playback: Optional[bool] = None
    pausing: Optional[bool] = None
    resuming: Optional[bool] = None
    seeking: Optional[bool] = None
    skipping_next: Optional[bool] = None
    skipping_prev: Optional[bool] = None
    toggling_repeat_context: Optional[bool] = None
    toggling_shuffle: Optional[bool] = None
    toggling_repeat_track: Optional[bool] = None
    transferring_playback: Optional[bool] = None


class PlaybackStateActions(BaseModel):
    disallows: Optional[PlaybackActions]


class PlaybackState(BaseModel):
    context: Optional[PlaybackContext]  # Make context optional
    progress_ms: Optional[int]
    is_playing: bool
    item: Optional[Track | Episode]
    timestamp: datetime
    currently_playing_type: str
    device: Device
    shuffle_state: bool
    repeat_state: str
    actions: PlaybackStateActions

    @field_validator("item", mode="plain")
    def set_protocol_validation_model(cls, v, validation_info: ValidationInfo):
        vals = validation_info.data
        context = vals.get("context")  # Safely access context
        if context and context.type == "show":
            return Episode.model_validate(v)
        elif context:
            return Track.model_validate(v)
        return v  # Return the value as-is if context is missing or invalid

    @field_validator("timestamp", mode="plain")
    def convert_timestamp_to_datetime(cls, v):
        return datetime.fromtimestamp(v / 1000)
