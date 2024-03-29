from pydantic import BaseModel


class Restrictions(BaseModel):
    reason: str
