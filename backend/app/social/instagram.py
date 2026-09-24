
from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
from dotenv import load_dotenv
import os
import requests
import secrets

from app.models.user import User
from app.models.social_account import SocialAccount
from app.security.dependencies import get_current_user
from app.database.connection import get_db


load_dotenv()


INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN")
INSTAGRAM_APP_SECRET = os.getenv("INSTAGRAM_APP_SECRET")

INSTAGRAM_APP_ID = "1065297846368970"

INSTAGRAM_REDIRECT_URI = (
    "https://pays-unsigned-giants-here.trycloudflare.com/"
    "api/social/instagram/callback"
)


router = APIRouter(
    prefix="/api/social/instagram",
    tags=["Instagram"],
)


oauth_states = {}


# --------------------------------------------------
# Helper: Redirect to dashboard with a message
# --------------------------------------------------

def redirect_to_dashboard(
    status: str,
    message: str,
):
    return RedirectResponse(
        url=(
            "http://localhost:3000/dashboard"
            + "?instagram="
            + urlencode({"": status})[1:]
            + "&message="
            + urlencode({"": message})[1:]
        )
    )


# --------------------------------------------------
# Token test
# --------------------------------------------------

@router.get("/token-test")
def token_test():
    return {
        "access_token_loaded": bool(INSTAGRAM_ACCESS_TOKEN),
        "app_secret_loaded": bool(INSTAGRAM_APP_SECRET),
    }


# --------------------------------------------------
# Get Instagram account
# --------------------------------------------------

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
    )

    return response.json()


# --------------------------------------------------
# Start Instagram OAuth
# --------------------------------------------------

@router.get("/login")
def instagram_login(
    current_user: User = Depends(get_current_user),
):

    state = secrets.token_urlsafe(32)

    oauth_states[state] = current_user.id

    params = {
        "client_id": INSTAGRAM_APP_ID,
        "redirect_uri": INSTAGRAM_REDIRECT_URI,
        "response_type": "code",
        "scope": "instagram_business_basic",
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


# --------------------------------------------------
# Instagram OAuth Callback
# --------------------------------------------------

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

    # --------------------------------------------------
    # 1. Instagram returned an OAuth error
    # --------------------------------------------------

    if error:

        oauth_states.pop(state, None)

        # Prefer Instagram's description when available.
        reason = (
            error_description
            or error_reason
            or error
        )

        return redirect_to_dashboard(
            "error",
            f"Instagram connection failed: {reason}",
        )

    # --------------------------------------------------
    # 2. Missing state
    # --------------------------------------------------

    if not state:

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: OAuth state was not received.",
        )

    # --------------------------------------------------
    # 3. Invalid / expired state
    # --------------------------------------------------

    user_id = oauth_states.get(state)

    if not user_id:

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: the authorization session expired or was invalid.",
        )

    # --------------------------------------------------
    # 4. Missing authorization code
    # --------------------------------------------------

    if not code:

        oauth_states.pop(state, None)

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: authorization was not completed.",
        )

    # --------------------------------------------------
    # 5. Exchange authorization code for access token
    # --------------------------------------------------

    token_url = "https://api.instagram.com/oauth/access_token"

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

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: unable to contact Instagram.",
        )

    # --------------------------------------------------
    # 6. Token exchange failed
    # --------------------------------------------------

    if response.status_code != 200:

        oauth_states.pop(state, None)

        # Try to get a useful error from Instagram.
        try:
            token_error = response.json()

            error_message = (
                token_error.get("error_message")
                or token_error.get("message")
                or token_error.get("error")
            )

        except ValueError:

            error_message = None

        return redirect_to_dashboard(
            "error",
            error_message
            or "Instagram rejected the authorization request.",
        )

    # --------------------------------------------------
    # 7. Parse token response
    # --------------------------------------------------

    try:

        token_response = response.json()

    except ValueError:

        oauth_states.pop(state, None)

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: invalid response received from Instagram.",
        )

    instagram_access_token = token_response.get(
        "access_token"
    )

    instagram_user_id = token_response.get(
        "user_id"
    )

    # --------------------------------------------------
    # 8. Missing access token
    # --------------------------------------------------

    if not instagram_access_token:

        oauth_states.pop(state, None)

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: Instagram did not provide an access token.",
        )

    # --------------------------------------------------
    # 9. Missing Instagram user ID
    # --------------------------------------------------

    if not instagram_user_id:

        oauth_states.pop(state, None)

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: Instagram account ID was not received.",
        )

    instagram_user_id = str(
        instagram_user_id
    )

    # --------------------------------------------------
    # 10. Get Instagram account information
    # --------------------------------------------------

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

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: unable to retrieve your Instagram account.",
        )

    # --------------------------------------------------
    # 11. Instagram account request failed
    # --------------------------------------------------

    if account_response.status_code != 200:

        oauth_states.pop(state, None)

        try:

            account_error = account_response.json()

            error_message = (
                account_error.get("error", {})
                .get("message")
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

        return redirect_to_dashboard(
            "error",
            error_message
            or "Instagram could not provide your account information.",
        )

    # --------------------------------------------------
    # 12. Parse Instagram account information
    # --------------------------------------------------

    try:

        account_data = account_response.json()

    except ValueError:

        oauth_states.pop(state, None)

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: invalid account information was received.",
        )

    instagram_username = account_data.get(
        "username"
    )

    # --------------------------------------------------
    # 13. Missing username
    # --------------------------------------------------

    if not instagram_username:

        oauth_states.pop(state, None)

        return redirect_to_dashboard(
            "error",
            "Instagram connection failed: Instagram username was not returned.",
        )

    # --------------------------------------------------
    # 14. Check existing connected account
    # --------------------------------------------------

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

        # --------------------------------------------------
        # 15. Update existing account
        # --------------------------------------------------

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

            existing_account.status = "connected"

            db.commit()
            db.refresh(existing_account)

            account_id = existing_account.id

        # --------------------------------------------------
        # 16. Create new account
        # --------------------------------------------------

        else:

            new_account = SocialAccount(
                user_id=user_id,
                platform="instagram",
                platform_user_id=instagram_user_id,
                platform_username=instagram_username,
                display_name=instagram_username,
                access_token=instagram_access_token,
                status="connected",
            )

            db.add(new_account)

            db.commit()
            db.refresh(new_account)

            account_id = new_account.id

    except Exception:

        db.rollback()

        oauth_states.pop(state, None)

        return redirect_to_dashboard(
            "error",
            "Instagram account was authorized, but SocialPilot could not save the account.",
        )

    # --------------------------------------------------
    # 17. Remove OAuth state
    # --------------------------------------------------

    oauth_states.pop(state, None)

    # --------------------------------------------------
    # 18. SUCCESS
    # --------------------------------------------------

    return redirect_to_dashboard(
        "connected",
        "Instagram account connected successfully.",
    )
