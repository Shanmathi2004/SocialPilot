from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PostCreate(BaseModel):

    content: str

    media_url: Optional[str] = None

    campaign_id: Optional[int] = None

    status: str = "draft"

    scheduled_at: Optional[datetime] = None

    is_recurring: bool = False

    recurrence_type: Optional[str] = None

    recurrence_end_date: Optional[datetime] = None

    # Selected social media accounts for this post
    social_account_ids: list[int] = Field(default_factory=list)


class PostUpdate(BaseModel):

    content: str

    media_url: Optional[str] = None

    campaign_id: Optional[int] = None

    status: str = "scheduled"

    scheduled_at: Optional[datetime] = None

    is_recurring: bool = False

    recurrence_type: Optional[str] = None

    recurrence_end_date: Optional[datetime] = None

    # None means: keep the existing social accounts
    social_account_ids: Optional[list[int]] = None


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