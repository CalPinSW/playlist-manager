from pydantic import BaseModel


class Image(BaseModel):
    url: str
    height: int
    width: int
