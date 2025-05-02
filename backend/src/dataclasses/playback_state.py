from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ValidationInfo, field_validator
from src.dataclasses.device import Device
from src.dataclasses.track import Track


class PlaybackContext(BaseModel):
    type: Literal["artist", "playlist", "album", "show"]
    uri: str


class Episode(BaseModel):
    id: str


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
    context: PlaybackContext
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
    def set_protocol_validation_model(cls, v, vlidation_info: ValidationInfo):
        vals = vlidation_info.data
        if vals["context"].type == "show":
            return Episode.model_validate(v)
        else:
            return Track.model_validate(v)

    @field_validator("timestamp", mode="plain")
    def convert_timestamp_to_datetime(cls, v):
        return datetime.fromtimestamp(v / 1000)
