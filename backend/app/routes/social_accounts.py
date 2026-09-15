
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.connection import get_db
from app.models.social_account import SocialAccount
from app.models.user import User
from app.security.dependencies import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/social-accounts",
    tags=["Social Accounts"],
)
class InstagramConnectRequest(BaseModel):
    platform_user_id: str
    platform_username: str
    access_token: str

# ============================================================
# GET ALL SOCIAL ACCOUNTS
# ============================================================

@router.get(
    "",
    status_code=status.HTTP_200_OK,
)
def get_social_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all social media accounts connected
    to the currently logged-in user.
    """

    accounts = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.user_id == current_user.id
        )
        .all()
    )

    return {
        "message": "Social accounts retrieved successfully.",
        "accounts": [
            {
                "id": account.id,
                "platform": account.platform,
                "platform_user_id": account.platform_user_id,
                "platform_username": account.platform_username,
                "display_name": account.display_name,
                "status": account.status,
                "token_expires_at": account.token_expires_at,
                "created_at": account.created_at,
                "updated_at": account.updated_at,
            }
            for account in accounts
        ],
    }


# ============================================================
# GET ONE SOCIAL ACCOUNT
# ============================================================

@router.get(
    "/{account_id}",
    status_code=status.HTTP_200_OK,
)
def get_social_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get one social media account.

    The account must belong to the currently
    logged-in user.
    """

    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id,
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found.",
        )

    return {
        "message": "Social account retrieved successfully.",
        "account": {
            "id": account.id,
            "platform": account.platform,
            "platform_user_id": account.platform_user_id,
            "platform_username": account.platform_username,
            "display_name": account.display_name,
            "status": account.status,
            "token_expires_at": account.token_expires_at,
            "created_at": account.created_at,
            "updated_at": account.updated_at,
        },
    }


# ============================================================
# DISCONNECT SOCIAL ACCOUNT
# ============================================================

@router.delete(
    "/{account_id}",
    status_code=status.HTTP_200_OK,
)
def disconnect_social_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Disconnect a social media account.

    We do not delete the database record.
    We simply change its status to 'disconnected'.
    """

    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id,
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found.",
        )

    account.status = "disconnected"

    db.commit()
    db.refresh(account)

    return {
        "message": "Social account disconnected successfully.",
        "account": {
            "id": account.id,
            "platform": account.platform,
            "status": account.status,
        },
    }
# ============================================================
# CONNECT INSTAGRAM ACCOUNT
# ============================================================

@router.post(
    "/instagram",
    status_code=status.HTTP_201_CREATED,
)
def connect_instagram_account(
    data: InstagramConnectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save an Instagram account for the currently
    logged-in SocialPilot user.
    """

    account = SocialAccount(
        user_id=current_user.id,
        platform="instagram",
        platform_user_id=data.platform_user_id,
        platform_username=data.platform_username,
        access_token=data.access_token,
        status="connected",
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return {
        "message": "Instagram account connected successfully.",
        "account": {
            "id": account.id,
            "platform": account.platform,
            "platform_user_id": account.platform_user_id,
            "platform_username": account.platform_username,
            "status": account.status,
        },
    }