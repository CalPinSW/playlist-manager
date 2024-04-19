from typing import Optional
from pydantic import BaseModel


class Followers(BaseModel):
    href: Optional[str] = None
    total: int
