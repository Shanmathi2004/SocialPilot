from urllib.parse import urlencode

import requests
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.social_account import SocialAccount
from app.models.user import User
from app.security.dependencies import get_current_user


router = APIRouter(
    prefix="/api/social/facebook",
    tags=["Facebook OAuth"],
)


FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID"
FACEBOOK_APP_SECRET = "YOUR_FACEBOOK_APP_SECRET"

FACEBOOK_REDIRECT_URI = os.getenv("FACEBOOK_REDIRECT_URI")

@router.get("/login")
def facebook_login(
    return_to: str = "/dashboard/social-accounts",
    current_user: User = Depends(get_current_user),
):
    params = {
        "client_id": FACEBOOK_APP_ID,
        "redirect_uri": FACEBOOK_REDIRECT_URI,
        "response_type": "code",
        "scope": "public_profile",
        "state": return_to,
    }

    login_url = (
        "https://www.facebook.com/v24.0/dialog/oauth?"
        + urlencode(params)
    )

    return {
        "login_url": login_url
    }


@router.get("/callback")
def facebook_callback(
    code: str | None = None,
    state: str = "/dashboard/social-accounts",
    db: Session = Depends(get_db),
):
    if not code:
        raise HTTPException(
            status_code=400,
            detail="Facebook authorization code was not provided.",
        )

    token_url = "https://graph.facebook.com/v24.0/oauth/access_token"

    token_params = {
        "client_id": FACEBOOK_APP_ID,
        "client_secret": FACEBOOK_APP_SECRET,
        "redirect_uri": FACEBOOK_REDIRECT_URI,
        "code": code,
    }

    response = requests.get(
        token_url,
        params=token_params,
        timeout=30,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Facebook token exchange failed.",
                "facebook_response": response.json(),
            },
        )

    token_data = response.json()

    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=400,
            detail="Facebook access token was not returned.",
        )

    return {
        "message": "Facebook authorization successful.",
        "access_token_received": True,
        "return_to": state,
    }