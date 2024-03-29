from typing import Optional
from pydantic import BaseModel


class ExternalIds(BaseModel):
    isrc: Optional[str] = None
    ean: Optional[str] = None
    upc: Optional[str] = None
