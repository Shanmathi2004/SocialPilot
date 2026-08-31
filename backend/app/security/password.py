from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError


password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2.
    """
    return password_hasher.hash(password)


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    """
    Verify a plain-text password against its Argon2 hash.
    """
    try:
        return password_hasher.verify(
            password_hash,
            password,
        )

    except VerifyMismatchError:
        return False