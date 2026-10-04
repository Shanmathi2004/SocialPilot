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

FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")
FACEBOOK_REDIRECT_URI = os.getenv("FACEBOOK_REDIRECT_URI")

FACEBOOK_CONFIG_ID = "1137366988824893"

FRONTEND_URL = "http://localhost:3000"

router = APIRouter(
    prefix="/api/social/facebook",
    tags=["Facebook"],
)

# state -> {"user_id": int, "return_to": str}
oauth_states = {}


def redirect_to_frontend(
    status: str,
    message: str,
    return_to: str = "/dashboard",
):
    if not return_to.startswith("/dashboard"):
        return_to = "/dashboard"

    query = urlencode(
        {
            "facebook": status,
            "message": message,
        }
    )

    return RedirectResponse(
        url=f"{FRONTEND_URL}{return_to}?{query}"
    )


@router.get("/login")
def facebook_login(
    return_to: str = "/dashboard",
    current_user: User = Depends(get_current_user),
):
    if not return_to.startswith("/dashboard"):
        return_to = "/dashboard"

    if not FACEBOOK_APP_ID:
        return {
            "error": "FACEBOOK_APP_ID is missing."
        }

    if not FACEBOOK_REDIRECT_URI:
        return {
            "error": "FACEBOOK_REDIRECT_URI is missing."
        }

    state = secrets.token_urlsafe(32)

    oauth_states[state] = {
        "user_id": current_user.id,
        "return_to": return_to,
    }

    params = {
        "client_id": FACEBOOK_APP_ID,
        "redirect_uri": FACEBOOK_REDIRECT_URI,
        "config_id": FACEBOOK_CONFIG_ID,
        "response_type": "code",
        "state": state,
    }

    facebook_url = (
        "https://www.facebook.com/v24.0/dialog/oauth?"
        + urlencode(params)
    )

    return {
        "login_url": facebook_url,
        "state": state,
    }


@router.get("/callback")
def facebook_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    state = request.query_params.get("state")
    code = request.query_params.get("code")

    error = request.query_params.get("error")
    error_description = request.query_params.get(
        "error_description"
    )

    # ---------------------------------------------------------
    # 1. Handle Facebook OAuth errors
    # ---------------------------------------------------------

    if error:
        oauth_data = (
            oauth_states.pop(state, None)
            if state
            else None
        )

        return_to = (
            oauth_data.get("return_to")
            if oauth_data
            else "/dashboard"
        )

        return redirect_to_frontend(
            "error",
            f"Facebook connection failed: "
            f"{error_description or error}",
            return_to,
        )

    # ---------------------------------------------------------
    # 2. Validate OAuth state
    # ---------------------------------------------------------

    if not state:
        return redirect_to_frontend(
            "error",
            "Facebook connection failed: OAuth state was not received.",
        )

    oauth_data = oauth_states.get(state)

    if not oauth_data:
        return redirect_to_frontend(
            "error",
            "Facebook connection failed: "
            "the authorization session expired or was invalid.",
        )

    user_id = oauth_data["user_id"]

    return_to = oauth_data.get(
        "return_to",
        "/dashboard",
    )

    # ---------------------------------------------------------
    # 3. Validate authorization code
    # ---------------------------------------------------------

    if not code:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook connection failed: "
            "authorization was not completed.",
            return_to,
        )

    # ---------------------------------------------------------
    # 4. Check Facebook App Secret
    # ---------------------------------------------------------

    if not FACEBOOK_APP_SECRET:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook connection failed: "
            "FACEBOOK_APP_SECRET is missing.",
            return_to,
        )

    # ---------------------------------------------------------
    # 5. Exchange authorization code for access token
    # ---------------------------------------------------------

    token_url = (
        "https://graph.facebook.com/v24.0/oauth/access_token"
    )

    token_params = {
        "client_id": FACEBOOK_APP_ID,
        "client_secret": FACEBOOK_APP_SECRET,
        "redirect_uri": FACEBOOK_REDIRECT_URI,
        "code": code,
    }

    try:
        response = requests.get(
            token_url,
            params=token_params,
            timeout=15,
        )

    except requests.RequestException:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook connection failed: "
            "unable to contact Facebook.",
            return_to,
        )

    if response.status_code != 200:
        oauth_states.pop(state, None)

        try:
            token_error = response.json()

            error_message = (
                token_error.get("error", {}).get("message")
                if isinstance(
                    token_error.get("error"),
                    dict,
                )
                else None
            )

        except ValueError:
            error_message = None

        return redirect_to_frontend(
            "error",
            error_message
            or "Facebook rejected the authorization request.",
            return_to,
        )

    try:
        token_response = response.json()

    except ValueError:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook connection failed: "
            "invalid token response.",
            return_to,
        )

    user_access_token = token_response.get(
        "access_token"
    )

    expires_in = token_response.get(
        "expires_in"
    )

    if not user_access_token:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook did not provide an access token.",
            return_to,
        )

    # ---------------------------------------------------------
    # 6. Calculate token expiry
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
    # 7. Get Facebook Pages
    # ---------------------------------------------------------

    pages_url = (
        "https://graph.facebook.com/v24.0/me/accounts"
    )

    pages_params = {
        "fields": "id,name,access_token",
        "access_token": user_access_token,
    }

    try:
        pages_response = requests.get(
            pages_url,
            params=pages_params,
            timeout=15,
        )

    except requests.RequestException:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook connection failed: "
            "unable to retrieve your Facebook Pages.",
            return_to,
        )

    if pages_response.status_code != 200:
        oauth_states.pop(state, None)

        try:
            pages_error = pages_response.json()

            error_message = (
                pages_error.get("error", {}).get("message")
                if isinstance(
                    pages_error.get("error"),
                    dict,
                )
                else None
            )

        except ValueError:
            error_message = None

        return redirect_to_frontend(
            "error",
            error_message
            or "Facebook could not provide your Pages.",
            return_to,
        )

    try:
        pages_data = pages_response.json()

    except ValueError:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook returned invalid Page information.",
            return_to,
        )

    pages = pages_data.get("data", [])

    if not pages:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "No Facebook Page was found for this account.",
            return_to,
        )

    # ---------------------------------------------------------
    # 8. Connect the first available Facebook Page
    # ---------------------------------------------------------

    page = pages[0]

    page_id = page.get("id")
    page_name = page.get("name")
    page_access_token = page.get("access_token")

    if not page_id:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook Page ID was not returned.",
            return_to,
        )

    if not page_access_token:
        oauth_states.pop(state, None)

        return redirect_to_frontend(
            "error",
            "Facebook Page access token was not returned.",
            return_to,
        )

    # ---------------------------------------------------------
    # 9. Save / update Facebook Page
    # ---------------------------------------------------------

    try:
        existing_account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == "facebook",
                SocialAccount.platform_user_id
                == str(page_id),
            )
            .first()
        )

        if existing_account:

            existing_account.platform_username = (
                page_name
            )

            existing_account.display_name = (
                page_name
            )

            existing_account.access_token = (
                page_access_token
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
                platform="facebook",
                platform_user_id=str(page_id),
                platform_username=page_name,
                display_name=page_name,
                access_token=page_access_token,
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
            "Facebook Page was authorized, but "
            "SocialPilot could not save the account.",
            return_to,
        )

    # ---------------------------------------------------------
    # 10. Remove OAuth state
    # ---------------------------------------------------------

    oauth_states.pop(state, None)

    # ---------------------------------------------------------
    # 11. Return to original page
    # ---------------------------------------------------------

    return redirect_to_frontend(
        "connected",
        f"Facebook Page '{page_name}' connected successfully.",
        return_to,
    )