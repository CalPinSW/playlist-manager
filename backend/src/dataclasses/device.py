from pydantic import BaseModel
from typing import Optional


class Device(BaseModel):
    id: str
    is_active: bool
    is_private_session: bool
    is_restricted: bool
    name: str
    type: str
    volume_percent: Optional[int]
    supports_volume: bool
