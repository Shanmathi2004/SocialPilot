from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ============================================================
# SOCIAL ACCOUNT RESPONSE
# ============================================================

class SocialAccountResponse(BaseModel):
    id: int
    platform: str
    platform_user_id: str
    platform_username: Optional[str] = None
    display_name: Optional[str] = None
    status: str
    token_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# SOCIAL ACCOUNT LIST RESPONSE
# ============================================================

class SocialAccountListResponse(BaseModel):
    accounts: list[SocialAccountResponse]

# ============================================================
# CONNECT SOCIAL ACCOUNT REQUEST
# ============================================================

class SocialAccountConnectRequest(BaseModel):
    platform: str
    platform_user_id: str
    platform_username: Optional[str] = None
    display_name: Optional[str] = None