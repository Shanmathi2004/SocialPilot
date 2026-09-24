from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PublishingLogCreate(BaseModel):
    post_id: int
    platform: str
    status: str
    error_message: Optional[str] = None


class PublishingLogResponse(BaseModel):
    id: int
    post_id: int
    platform: str
    status: str
    published_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime