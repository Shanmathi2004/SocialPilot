from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ==========================================================
# SOCIAL ACCOUNT RESPONSE
# ==========================================================

class SocialAccountSummary(BaseModel):

    id: int

    platform: str

    platform_username: Optional[str] = None

    display_name: Optional[str] = None

    status: str

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# CAMPAIGN RESPONSE
# ==========================================================

class CampaignSummary(BaseModel):

    id: int

    name: str

    description: Optional[str] = None

    status: str

    start_date: Optional[datetime] = None

    end_date: Optional[datetime] = None

    budget: float = 0

    revenue: float = 0

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# CREATE POST
# ==========================================================

class PostCreate(BaseModel):

    content: str

    media_url: Optional[str] = None

    campaign_id: Optional[int] = None

    status: str = "draft"

    scheduled_at: Optional[datetime] = None

    is_recurring: bool = False

    recurrence_type: Optional[str] = None

    recurrence_end_date: Optional[datetime] = None

    # Selected social media accounts
    social_account_ids: list[int] = Field(
        default_factory=list
    )


# ==========================================================
# UPDATE POST
# ==========================================================

class PostUpdate(BaseModel):

    content: str

    media_url: Optional[str] = None

    campaign_id: Optional[int] = None

    status: str = "scheduled"

    scheduled_at: Optional[datetime] = None

    is_recurring: bool = False

    recurrence_type: Optional[str] = None

    recurrence_end_date: Optional[datetime] = None

    # None means keep existing accounts
    social_account_ids: Optional[list[int]] = None


# ==========================================================
# POST RESPONSE
# ==========================================================

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

    # ------------------------------------------------------
    # RELATED CAMPAIGN
    # ------------------------------------------------------

    campaign: Optional[CampaignSummary] = None

    # ------------------------------------------------------
    # SELECTED SOCIAL ACCOUNTS
    # ------------------------------------------------------

    social_accounts: list[SocialAccountSummary] = Field(
        default_factory=list
    )

    model_config = ConfigDict(
        from_attributes=True
    )