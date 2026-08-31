from fastapi import APIRouter, Depends

from app.models.user import User
from app.security.dependencies import (
    get_current_user,
    get_current_admin,
)


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):

    return {
        "message": "Authenticated user.",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "is_email_verified": current_user.is_email_verified,
        },
    }


# ============================================================
# ADMIN ONLY
# ============================================================

@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(get_current_admin),
):

    return {
        "message": "Welcome to the admin area.",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
        },
    }