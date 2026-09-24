from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "draft"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime