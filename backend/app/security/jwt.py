from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from dotenv import load_dotenv
import os


load_dotenv()


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


def create_access_token(data: dict) -> str:
    """
    Create a JWT access token.
    """

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire,
    })

    return jwt.encode(
        to_encode,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate a JWT access token.
    """

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        return payload

    except JWTError:
        return None
