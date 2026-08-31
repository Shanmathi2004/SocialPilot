from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.security.password import hash_password


def register_user(
    db: Session,
    data: RegisterRequest,
) -> User:
    # Check whether the email is already registered
    existing_email = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_email:
        raise ValueError("Email is already registered.")

    # Check whether the username is already taken
    existing_username = (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    )

    if existing_username:
        raise ValueError("Username is already taken.")

    # Hash the password before storing it
    hashed_password = hash_password(data.password)

    # Create the new user
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hashed_password,
    )

    # Save the user
    db.add(user)
    db.commit()
    db.refresh(user)

    return user