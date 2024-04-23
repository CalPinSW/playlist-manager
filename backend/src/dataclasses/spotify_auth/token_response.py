from typing import Optional
from pydantic import BaseModel

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    scope: str
    expires_in: int
    refresh_token: Optional[str] = None
