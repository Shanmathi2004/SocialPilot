
import os
import secrets
from datetime import datetime, timedelta, timezone
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

YOUTUBE_CLIENT_ID = os.getenv("YOUTUBE_CLIENT_ID")
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET")
YOUTUBE_REDIRECT_URI = os.getenv("YOUTUBE_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"

router = APIRouter(
    prefix="/api/social/youtube",
    tags=["YouTube"],
)

# Temporary OAuth state storage.
# This works while the same FastAPI process remains running.
oauth_states: dict[str, int] = {}


def redirect_to_social_accounts(
    status: str,
    message: str | None = None,
):
    url = f"{FRONTEND_URL}/dashboard/social-accounts?youtube={status}"

    if message:
        url += f"&message={quote(message)}"

    return RedirectResponse(url=url)


@router.get("/login")
def youtube_login(
    current_user=Depends(get_current_user),
):
    if not YOUTUBE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="YouTube Client ID is not configured.",
        )

    if not YOUTUBE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="YouTube Client Secret is not configured.",
        )

    if not YOUTUBE_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail="YouTube Redirect URI is not configured.",
        )

    state = secrets.token_urlsafe(32)

    oauth_states[state] = current_user.id

    params = {
        "client_id": YOUTUBE_CLIENT_ID,
        "redirect_uri": YOUTUBE_REDIRECT_URI,
        "response_type": "code",
       "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    login_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    print("========================================")
    print("YouTube OAuth started")
    print("User ID:", current_user.id)
    print("Redirect URI:", YOUTUBE_REDIRECT_URI)
    print("OAuth state created:", state)
    print("========================================")

    return {
        "login_url": login_url,
    }


@router.get("/callback")
def youtube_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: Session = Depends(get_db),
):
    print("========================================")
    print("YouTube OAuth callback received")
    print("Code received:", bool(code))
    print("State received:", bool(state))
    print("Google error:", error)
    print("========================================")

    if error:
        return redirect_to_social_accounts(
            "error",
            error_description or error,
        )

    if not code:
        return redirect_to_social_accounts(
            "error",
            "YouTube authorization code is missing.",
        )

    if not state:
        return redirect_to_social_accounts(
            "error",
            "YouTube OAuth state is missing.",
        )

    if state not in oauth_states:
        print("ERROR: OAuth state was not found.")
        print("Received state:", state)
        print("Available states:", list(oauth_states.keys()))

        return redirect_to_social_accounts(
            "error",
            "Invalid or expired YouTube OAuth state. Please start the connection again.",
        )

    user_id = oauth_states.pop(state)

    print("YouTube OAuth belongs to user ID:", user_id)

    # --------------------------------------------------
    # EXCHANGE GOOGLE CODE FOR TOKENS
    # --------------------------------------------------

    try:
        token_response = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": YOUTUBE_CLIENT_ID,
                "client_secret": YOUTUBE_CLIENT_SECRET,
                "redirect_uri": YOUTUBE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        print("Google token request failed:", repr(exc))

        return redirect_to_social_accounts(
            "error",
            "Unable to connect to Google.",
        )

    print("Google token response status:", token_response.status_code)

    if not token_response.ok:
        print("Google token response:", token_response.text)

        return redirect_to_social_accounts(
            "error",
            "YouTube token exchange failed.",
        )

    token_data = token_response.json()

    print("Google token received.")
    print("Access token present:", bool(token_data.get("access_token")))
    print("Refresh token present:", bool(token_data.get("refresh_token")))

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")

    if not access_token:
        return redirect_to_social_accounts(
            "error",
            "YouTube access token was not returned.",
        )

    token_expires_at = None

    if expires_in:
        token_expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=int(expires_in)
        )

    # --------------------------------------------------
    # GET YOUTUBE CHANNEL
    # --------------------------------------------------

    try:
        channel_response = requests.get(
            YOUTUBE_CHANNELS_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
            },
            params={
                "part": "snippet",
                "mine": "true",
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        print("YouTube channel request failed:", repr(exc))

        return redirect_to_social_accounts(
            "error",
            "Unable to retrieve YouTube channel.",
        )

    print("YouTube channel response status:", channel_response.status_code)

    if not channel_response.ok:
        print("YouTube channel response:", channel_response.text)

        return redirect_to_social_accounts(
            "error",
            "Unable to retrieve YouTube channel.",
        )

    channel_data = channel_response.json()

    print("YouTube channel response:", channel_data)

    items = channel_data.get("items", [])

    if not items:
        return redirect_to_social_accounts(
            "error",
            "No YouTube channel was found for this Google account.",
        )

    channel = items[0]

    channel_id = channel.get("id")

    snippet = channel.get("snippet", {})

    channel_title = snippet.get("title") or "YouTube Channel"

    if not channel_id:
        return redirect_to_social_accounts(
            "error",
            "YouTube channel ID was not returned.",
        )

    print("YouTube channel found:")
    print("Channel ID:", channel_id)
    print("Channel title:", channel_title)

    # --------------------------------------------------
    # SAVE / UPDATE SOCIAL ACCOUNT
    # --------------------------------------------------

    try:
        existing_account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == "youtube",
                SocialAccount.platform_user_id == channel_id,
            )
            .first()
        )

        if existing_account:
            print("Updating existing YouTube account:", existing_account.id)

            existing_account.access_token = access_token

            if refresh_token:
                existing_account.refresh_token = refresh_token

            existing_account.platform_username = channel_title
            existing_account.display_name = channel_title
            existing_account.token_expires_at = token_expires_at
            existing_account.status = "connected"

        else:
            print("Creating new YouTube SocialAccount")

            youtube_account = SocialAccount(
                user_id=user_id,
                platform="youtube",
                platform_user_id=channel_id,
                platform_username=channel_title,
                display_name=channel_title,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=token_expires_at,
                status="connected",
            )

            db.add(youtube_account)

        db.commit()

        print("YouTube SocialAccount saved successfully.")

    except Exception as exc:
        db.rollback()

        print("========================================")
        print("DATABASE ERROR WHILE SAVING YOUTUBE")
        print(repr(exc))
        print("========================================")

        return redirect_to_social_accounts(
            "error",
            "Unable to save YouTube account. Check the backend terminal.",
        )

    return redirect_to_social_accounts(
        "connected",
        "YouTube account connected successfully.",
    )

