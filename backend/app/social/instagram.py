from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import os
import secrets

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.social_account import SocialAccount
from app.models.user import User
from app.security.dependencies import get_current_user


load_dotenv()

INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN")
INSTAGRAM_APP_SECRET = os.getenv("INSTAGRAM_APP_SECRET")
INSTAGRAM_APP_ID = "1065297846368970"
INSTAGRAM_REDIRECT_URI = (
    "https://nancy-northwest-hall-andreas.trycloudflare.com/api/social/instagram/callback"
)
FRONTEND_URL = "http://localhost:3000"

router = APIRouter(
    prefix="/api/social/instagram",
    tags=["Instagram"],
)

# state -> {"user_id": int, "return_to": str}
oauth_states = {}


def redirect_to_frontend(
    status: str,
    message: str,
    return_to: str = "/dashboard",
):
    # Only allow internal SocialPilot dashboard paths.
    if not return_to.startswith("/dashboard"):
        return_to = "/dashboard"

    query = urlencode(
        {
            "instagram": status,
            "message": message,
        }
    )

    return RedirectResponse(
        url=f"{FRONTEND_URL}{return_to}?{query}"
    )


@router.get("/token-test")
def token_test():
    return {
        "access_token_loaded": bool(INSTAGRAM_ACCESS_TOKEN),
        "app_secret_loaded": bool(INSTAGRAM_APP_SECRET),
    }


@router.get("/account")
def get_instagram_account():
    url = "https://graph.instagram.com/v24.0/me"

    params = {
        "fields": "id,username",
        "access_token": INSTAGRAM_ACCESS_TOKEN,
    }

    response = requests.get(
        url,
        params=params,
        timeout=15,
    )

    return response.json()


@router.get("/login")
def instagram_login(
    return_to: str = "/dashboard",
    current_user: User = Depends(get_current_user),
):
    # Only allow dashboard pages as return locations.
    if not return_to.startswith("/dashboard"):
        return_to = "/dashboard"

    state = secrets.token_urlsafe(32)

    oauth_states[state] = {
        "user_id": current_user.id,
        "return_to": return_to,
    }

    params = {
        "client_id": INSTAGRAM_APP_ID,
        "redirect_uri": INSTAGRAM_REDIRECT_URI,
        "response_type": "code",
        "scope": (
            "instagram_business_basic,"
            "instagram_business_content_publish"
        ),
        "state": state,
        "force_reauth": "true",
    }

    instagram_url = (
        "https://www.instagram.com/oauth/authorize?"
        + urlencode(params)
    )

    return {
        "login_url": instagram_url,
        "state": state,
    }


@router.get("/callback")
def instagram_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    state = request.query_params.get("state")
    code = request.query_params.get("code")

    error = request.query_params.get("error")
    error_reason = request.query_params.get("error_reason")
    error_description = request.query_params.get("error_description")

    # ---------------------------------------------------------
    # 1. Check Instagram OAuth errors
    # ---------------------------------------------------------

    if error:
        oauth_data = oauth_states.pop(state, None) if state else None

        return_to = (
            oauth_data.get("return_to")
            if oauth_data
            else "/dashboard"
        )

        reason = (
            error_description
            or error_reason
            or error
        )

        return redirect_to_frontend(
            "error",
            f"Instagram connection failed: {reason}",
            return_to,
        )

    # ---------------------------------------------------------
    # 2. Check OAuth state
    # ---------------------------------------------------------

    if not state:
        return redirect_to_frontend(
            "error",
            "Instagram connection failed: OAuth state was not received.",
        )

    oauth_data = oauth_states.get(state)

    if not oauth_data:
        return redirect_to_frontend(
            "error",
            "Instagram connection failed: the authorization session expired or was invalid.",
        )

    user_id = oauth_data["user_id"]
    return_to = oauth_data.get(
        "return_to",
        "/dashboard",
    )

    # ---------------------------------------------------------
    # 3. Check authorization code
    # ---------------------------------------------------------

    if not code:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: authorization was not completed.",
            return_to,
        )

    # ---------------------------------------------------------
    # 4. Check App Secret
    # ---------------------------------------------------------

    if not INSTAGRAM_APP_SECRET:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: INSTAGRAM_APP_SECRET is missing.",
            return_to,
        )

    # ---------------------------------------------------------
    # 5. Exchange authorization code for SHORT-LIVED token
    # ---------------------------------------------------------

    token_url = (
        "https://api.instagram.com/oauth/access_token"
    )

    token_data = {
        "client_id": INSTAGRAM_APP_ID,
        "client_secret": INSTAGRAM_APP_SECRET,
        "grant_type": "authorization_code",
        "redirect_uri": INSTAGRAM_REDIRECT_URI,
        "code": code,
    }

    try:
        response = requests.post(
            token_url,
            data=token_data,
            timeout=15,
        )
    except requests.RequestException:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: unable to contact Instagram.",
            return_to,
        )

    if response.status_code != 200:
        oauth_states.pop(state, None)

        try:
            token_error = response.json()

            error_message = (
                token_error.get("error_message")
                or token_error.get("message")
                or token_error.get("error")
            )

        except ValueError:
            error_message = None

        return redirect_to_frontend(
            "error",
            error_message
            or "Instagram rejected the authorization request.",
            return_to,
        )

    try:
        token_response = response.json()

    except ValueError:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: invalid response received from Instagram.",
            return_to,
        )

    short_lived_token = token_response.get(
        "access_token"
    )

    instagram_user_id = token_response.get(
        "user_id"
    )

    if not short_lived_token:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: Instagram did not provide an access token.",
            return_to,
        )

    if not instagram_user_id:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: Instagram account ID was not received.",
            return_to,
        )

    instagram_user_id = str(
        instagram_user_id
    )

    # ---------------------------------------------------------
    # 6. Exchange SHORT-LIVED token for LONG-LIVED token
    # ---------------------------------------------------------

    long_lived_url = (
        "https://graph.instagram.com/access_token"
    )

    long_lived_params = {
        "grant_type": "ig_exchange_token",
        "client_secret": INSTAGRAM_APP_SECRET,
        "access_token": short_lived_token,
    }

    try:
        long_lived_response = requests.get(
            long_lived_url,
            params=long_lived_params,
            timeout=15,
        )

    except requests.RequestException:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: unable to exchange the access token.",
            return_to,
        )

    if long_lived_response.status_code != 200:
        oauth_states.pop(state, None)

        try:
            long_lived_error = (
                long_lived_response.json()
            )

            error_message = (
                long_lived_error.get("error", {}).get(
                    "message"
                )
                if isinstance(
                    long_lived_error.get("error"),
                    dict,
                )
                else None
            )

            if not error_message:
                error_message = (
                    long_lived_error.get("message")
                )

        except ValueError:
            error_message = None

        return redirect_to_frontend(
            "error",
            error_message
            or "Instagram could not create a long-lived access token.",
            return_to,
        )

    try:
        long_lived_data = (
            long_lived_response.json()
        )

    except ValueError:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: invalid long-lived token response.",
            return_to,
        )

    instagram_access_token = (
        long_lived_data.get("access_token")
    )

    expires_in = long_lived_data.get(
        "expires_in"
    )

    if not instagram_access_token:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram did not return a long-lived access token.",
            return_to,
        )

    # ---------------------------------------------------------
    # 7. Calculate token expiry time
    # ---------------------------------------------------------

    token_expires_at = None

    if expires_in:
        token_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(
                seconds=int(expires_in)
            )
        )

    # ---------------------------------------------------------
    # 8. Get Instagram account information
    # ---------------------------------------------------------

    account_url = (
        "https://graph.instagram.com/v24.0/me"
    )

    account_params = {
        "fields": "id,username",
        "access_token": instagram_access_token,
    }

    try:
        account_response = requests.get(
            account_url,
            params=account_params,
            timeout=15,
        )

    except requests.RequestException:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: unable to retrieve your Instagram account.",
            return_to,
        )

    if account_response.status_code != 200:
        oauth_states.pop(state, None)

        try:
            account_error = (
                account_response.json()
            )

            error_message = (
                account_error.get(
                    "error",
                    {},
                ).get("message")
                if isinstance(
                    account_error.get("error"),
                    dict,
                )
                else None
            )

            if not error_message:
                error_message = (
                    account_error.get("message")
                )

        except ValueError:
            error_message = None

        return redirect_to_frontend(
            "error",
            error_message
            or "Instagram could not provide your account information.",
            return_to,
        )

    try:
        account_data = account_response.json()

    except ValueError:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: invalid account information was received.",
            return_to,
        )

    instagram_username = account_data.get(
        "username"
    )

    if not instagram_username:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram connection failed: Instagram username was not returned.",
            return_to,
        )

    # ---------------------------------------------------------
    # 9. Save / update Instagram account
    # ---------------------------------------------------------

    try:
        existing_account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == "instagram",
                SocialAccount.platform_user_id
                == instagram_user_id,
            )
            .first()
        )

        if existing_account:

            existing_account.platform_username = (
                instagram_username
            )

            existing_account.display_name = (
                instagram_username
            )

            existing_account.access_token = (
                instagram_access_token
            )

            existing_account.token_expires_at = (
                token_expires_at
            )

            existing_account.status = "connected"

            db.commit()
            db.refresh(existing_account)

        else:

            new_account = SocialAccount(
                user_id=user_id,
                platform="instagram",
                platform_user_id=instagram_user_id,
                platform_username=instagram_username,
                display_name=instagram_username,
                access_token=instagram_access_token,
                token_expires_at=token_expires_at,
                status="connected",
            )

            db.add(new_account)

            db.commit()
            db.refresh(new_account)

    except Exception:
        db.rollback()
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Instagram account was authorized, but SocialPilot could not save the account.",
            return_to,
        )

    # ---------------------------------------------------------
    # 10. Remove OAuth state
    # ---------------------------------------------------------

    oauth_states.pop(state, None)

    # ---------------------------------------------------------
    # 11. Return to the original page
    # ---------------------------------------------------------

    return redirect_to_frontend(
        "connected",
        "Instagram account connected successfully.",
        return_to,
    )