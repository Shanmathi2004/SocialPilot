import secrets


def generate_verification_code() -> str:
    """
    Generate a secure 6-digit email verification code.
    """
    return f"{secrets.randbelow(1_000_000):06d}"