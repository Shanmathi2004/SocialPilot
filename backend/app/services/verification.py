import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.email_verification import EmailVerification


def create_verification_code(
    db: Session,
    user_id: int,
) -> EmailVerification:
    # Generate a random 6-digit code
    code = str(random.randint(100000, 999999))

    # Code expires after 10 minutes
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    verification = EmailVerification(
        user_id=user_id,
        code=code,
        expires_at=expires_at,
        used=False,
    )

    db.add(verification)
    db.commit()
    db.refresh(verification)

    return verification


def verify_email_code(
    db: Session,
    email: str,
    code: str,
):
    # Find the user by email
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise ValueError("User not found.")

    # Check whether the email is already verified
    if user.is_email_verified:
        raise ValueError("Email is already verified.")

    # Find the latest matching unused verification code
    verification = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.code == code,
            EmailVerification.used == False,
        )
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if not verification:
        raise ValueError("Invalid verification code.")

    # Check whether the code has expired
    if verification.expires_at < datetime.now(timezone.utc):
        raise ValueError("Verification code has expired.")

    # Mark the verification code as used
    verification.used = True

    # Mark the user's email as verified
    user.is_email_verified = True

    db.commit()
    db.refresh(user)

    return user