from typing import Optional
from pydantic import BaseModel


class Image(BaseModel):
    url: str
    height: Optional[int] = None
    width: Optional[int] = None
