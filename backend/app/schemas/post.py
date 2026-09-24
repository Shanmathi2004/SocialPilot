from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    campaign_id: Optional[int] = None
    status: str = "draft"
    scheduled_at: Optional[datetime] = None
    is_recurring: bool = False
    recurrence_type: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None


class PostResponse(BaseModel):
    id: int
    user_id: int
    content: str
    media_url: Optional[str] = None
    campaign_id: Optional[int] = None
    status: str
    scheduled_at: Optional[datetime] = None
    is_recurring: bool
    recurrence_type: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime