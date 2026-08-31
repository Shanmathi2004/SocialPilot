from datetime import datetime, timedelta, timezone
import os

from dotenv import load_dotenv
from jose import jwt


load_dotenv()


# ============================================================
# JWT SETTINGS
# ============================================================

SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "socialpilot-development-secret-key-change-this",
)

ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256",
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(data: dict) -> str:

    payload = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload["exp"] = expire

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return token


# ============================================================
# DECODE ACCESS TOKEN
# ============================================================

def decode_access_token(token: str) -> dict:

    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )

    return payload