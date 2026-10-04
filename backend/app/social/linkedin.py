import os
import secrets
from urllib.parse import urlencode, quote

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.security.dependencies import get_current_user
from app.models.social_account import SocialAccount


load_dotenv()


# ============================================================
# LinkedIn Configuration
# ============================================================

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
)

LINKEDIN_AUTH_URL = (
    "https://www.linkedin.com/oauth/v2/authorization"
)

LINKEDIN_TOKEN_URL = (
    "https://www.linkedin.com/oauth/v2/accessToken"
)

LINKEDIN_USERINFO_URL = (
    "https://api.linkedin.com/v2/userinfo"
)


# ============================================================
# Router
# ============================================================

router = APIRouter(
    prefix="/api/social/linkedin",
    tags=["LinkedIn"],
)


# ============================================================
# Temporary OAuth State Storage
# ============================================================

oauth_states: dict[str, int] = {}


# ============================================================
# Helper: Frontend Redirect
# ============================================================

def redirect_to_social_accounts(
    status: str,
    message: str | None = None,
):
    url = (
        f"{FRONTEND_URL}/dashboard/social-accounts"
        f"?linkedin={status}"
    )

    if message:
        url += f"&message={quote(message)}"

    return RedirectResponse(url=url)


# ============================================================
# LinkedIn Login
# ============================================================

@router.get("/login")
def linkedin_login(
    current_user=Depends(get_current_user),
):
    """
    Start LinkedIn OAuth login.
    """

    if not LINKEDIN_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="LinkedIn Client ID is not configured.",
        )

    if not LINKEDIN_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="LinkedIn Client Secret is not configured.",
        )

    if not LINKEDIN_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail="LinkedIn Redirect URI is not configured.",
        )

    # Generate secure OAuth state
    state = secrets.token_urlsafe(32)

    # Remember which SocialPilot user started OAuth
    oauth_states[state] = current_user.id

    # Permissions required for:
    # - LinkedIn login
    # - Reading basic profile information
    # - Creating posts on behalf of the user
    scope = "openid profile email w_member_social"

    params = {
        "response_type": "code",
        "client_id": LINKEDIN_CLIENT_ID,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": scope,
    }

    login_url = (
        f"{LINKEDIN_AUTH_URL}?"
        f"{urlencode(params)}"
    )

    return {
        "login_url": login_url,
    }


# ============================================================
# LinkedIn OAuth Callback
# ============================================================

@router.get("/callback")
def linkedin_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: Session = Depends(get_db),
):
    """
    LinkedIn redirects the user here after authorization.
    """

    # --------------------------------------------------------
    # User cancelled / LinkedIn returned an OAuth error
    # --------------------------------------------------------

    if error:
        return redirect_to_social_accounts(
            "error",
            error_description or error,
        )

    # --------------------------------------------------------
    # Authorization code missing
    # --------------------------------------------------------

    if not code:
        return redirect_to_social_accounts(
            "error",
            "LinkedIn authorization code is missing.",
        )

    # --------------------------------------------------------
    # OAuth state validation
    # --------------------------------------------------------

    if not state:
        return redirect_to_social_accounts(
            "error",
            "LinkedIn OAuth state is missing.",
        )

    if state not in oauth_states:
        return redirect_to_social_accounts(
            "error",
            "Invalid or expired LinkedIn OAuth state.",
        )

    # Retrieve the SocialPilot user ID
    user_id = oauth_states.pop(state)

    # --------------------------------------------------------
    # Exchange authorization code for access token
    # --------------------------------------------------------

    try:
        token_response = requests.post(
            LINKEDIN_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": LINKEDIN_REDIRECT_URI,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
            timeout=30,
        )
    except requests.RequestException:
        return redirect_to_social_accounts(
            "error",
            "Unable to connect to LinkedIn.",
        )

    if not token_response.ok:
        return redirect_to_social_accounts(
            "error",
            "LinkedIn token exchange failed.",
        )

    token_data = token_response.json()

    access_token = token_data.get("access_token")

    if not access_token:
        return redirect_to_social_accounts(
            "error",
            "LinkedIn access token was not returned.",
        )

    # --------------------------------------------------------
    # Get LinkedIn profile
    # --------------------------------------------------------

    try:
        userinfo_response = requests.get(
            LINKEDIN_USERINFO_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
            },
            timeout=30,
        )
    except requests.RequestException:
        return redirect_to_social_accounts(
            "error",
            "Unable to retrieve LinkedIn profile.",
        )

    if not userinfo_response.ok:
        return redirect_to_social_accounts(
            "error",
            "Unable to retrieve LinkedIn profile.",
        )

    userinfo = userinfo_response.json()

    # --------------------------------------------------------
    # LinkedIn user ID
    # --------------------------------------------------------

    linkedin_user_id = userinfo.get("sub")

    if not linkedin_user_id:
        return redirect_to_social_accounts(
            "error",
            "LinkedIn user ID was not returned.",
        )

    # --------------------------------------------------------
    # Profile name
    # --------------------------------------------------------

    name = (
        userinfo.get("name")
        or userinfo.get("given_name")
        or "LinkedIn User"
    )

    # --------------------------------------------------------
    # Check whether this LinkedIn account already exists
    # --------------------------------------------------------

    existing_account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.user_id == user_id,
            SocialAccount.platform == "linkedin",
            SocialAccount.platform_user_id == linkedin_user_id,
        )
        .first()
    )

    # --------------------------------------------------------
    # Update existing account
    # --------------------------------------------------------

    if existing_account:

        existing_account.access_token = access_token

        existing_account.platform_username = name

        existing_account.display_name = name

        existing_account.status = "connected"

    # --------------------------------------------------------
    # Create new account
    # --------------------------------------------------------

    else:

        linkedin_account = SocialAccount(
            user_id=user_id,
            platform="linkedin",
            platform_user_id=linkedin_user_id,
            platform_username=name,
            display_name=name,
            access_token=access_token,
            status="connected",
        )

        db.add(linkedin_account)

    # --------------------------------------------------------
    # Save to PostgreSQL
    # --------------------------------------------------------

    try:
        db.commit()
    except Exception:
        db.rollback()

        return redirect_to_social_accounts(
            "error",
            "Unable to save LinkedIn account.",
        )

    # --------------------------------------------------------
    # Success
    # --------------------------------------------------------

    return redirect_to_social_accounts(
        "connected",
        "LinkedIn account connected successfully.",
    )