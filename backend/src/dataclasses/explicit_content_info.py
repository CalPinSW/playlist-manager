from pydantic import BaseModel


class ExplicitContent(BaseModel):
    filter_enabled: bool
    filter_locked: bool
