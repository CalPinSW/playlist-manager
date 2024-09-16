from typing import List, Optional
from pydantic import BaseModel, Field


class Tag(BaseModel):
    count: int
    name: str


class ReleaseGroup(BaseModel):
    tags: Optional[List[Tag]] = None


class ReleaseGroupResponse(BaseModel):
    count: int
    release_groups: List[ReleaseGroup] = Field(alias="release-groups")
