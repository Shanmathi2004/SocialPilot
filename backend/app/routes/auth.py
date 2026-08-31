from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.auth import (
    RegisterRequest,
    VerifyEmailRequest,
    LoginRequest,
)
from app.services.auth import register_user
from app.services.verification import (
    create_verification_code,
    verify_email_code,
)
from app.services.login import login_user
from app.email.service import send_verification_email
from app.security.jwt import create_access_token


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        # 1. Create the user
        user = register_user(db, data)

        # 2. Generate and save verification code
        verification = create_verification_code(
            db=db,
            user_id=user.id,
        )

        # 3. Send verification code to user's email
        await send_verification_email(
            email=user.email,
            code=verification.code,
        )

        return {
            "message": (
                "Account created successfully. "
                "Please check your email for the verification code."
            ),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_email_verified": user.is_email_verified,
            },
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# ============================================================
# VERIFY EMAIL
# ============================================================

@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
)
def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    try:
        # Verify the email verification code
        user = verify_email_code(
            db=db,
            email=data.email,
            code=data.code,
        )

        return {
            "message": "Email verified successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_email_verified": user.is_email_verified,
            },
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    try:
        # 1. Check email, password and email verification
        user = login_user(
            db=db,
            email=data.email,
            password=data.password,
        )

        # 2. Create JWT access token
        access_token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
            }
        )

        # 3. Return login response
        return {
            "message": "Login successful.",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_email_verified": user.is_email_verified,
            },
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        )
