from sqlalchemy.orm import Session

from app.models.user import User
from app.security.password import verify_password


def login_user(
    db: Session,
    email: str,
    password: str,
) -> User:
    # Find the user by email
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Do not reveal whether the email exists
    if not user:
        raise ValueError("Invalid email or password.")

    # Check the password against the stored Argon2 hash
    if not verify_password(
        password,
        user.password_hash,
    ):
        raise ValueError("Invalid email or password.")

    # User must verify their email before logging in
    if not user.is_email_verified:
        raise ValueError(
            "Please verify your email before logging in."
        )

    return user