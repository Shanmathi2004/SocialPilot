from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate, PostResponse
from app.security.dependencies import get_current_user


router = APIRouter(
    prefix="/api/posts",
    tags=["Posts"],
)


# ==========================================================
# CREATE POST
# ==========================================================

@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.is_recurring:

        if data.scheduled_at is None:
            raise HTTPException(
                status_code=400,
                detail="Recurring posts must have a scheduled time.",
            )

        if data.recurrence_type not in [
            "daily",
            "weekly",
            "monthly",
        ]:
            raise HTTPException(
                status_code=400,
                detail="Recurrence type must be daily, weekly, or monthly.",
            )

        if data.recurrence_end_date is not None:
            if data.recurrence_end_date <= data.scheduled_at:
                raise HTTPException(
                    status_code=400,
                    detail="Recurrence end date must be after the scheduled time.",
                )

    if data.scheduled_at is not None:

        scheduled_time = data.scheduled_at

        if scheduled_time.tzinfo is None:
            scheduled_time = scheduled_time.replace(
                tzinfo=timezone.utc
            )

        if scheduled_time <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Scheduled time must be in the future.",
            )

        post_status = "scheduled"

    else:
        post_status = "draft"

    social_account_ids = data.social_account_ids or []

    social_accounts = []

    if social_account_ids:

        social_accounts = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.id.in_(social_account_ids),
                SocialAccount.user_id == current_user.id,
                SocialAccount.status == "connected",
            )
            .all()
        )

        if len(social_accounts) != len(set(social_account_ids)):
            raise HTTPException(
                status_code=400,
                detail="One or more selected social accounts are invalid or not connected.",
            )

    post = Post(
        user_id=current_user.id,
        content=data.content,
        media_url=data.media_url,
        campaign_id=data.campaign_id,
        status=post_status,
        scheduled_at=data.scheduled_at,
        is_recurring=data.is_recurring,
        recurrence_type=data.recurrence_type,
        recurrence_end_date=data.recurrence_end_date,
    )

    post.social_accounts = social_accounts

    db.add(post)
    db.commit()
    db.refresh(post)

    return post


# ==========================================================
# GET POSTS
# ==========================================================

@router.get(
    "",
    response_model=list[PostResponse],
)
def get_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = (
        db.query(Post)
        .filter(Post.user_id == current_user.id)
        .order_by(Post.created_at.desc())
        .all()
    )

    return posts


# ==========================================================
# UPDATE / RESCHEDULE POST
# ==========================================================

@router.put(
    "/{post_id}",
    response_model=PostResponse,
)
def update_post(
    post_id: int,
    data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = (
        db.query(Post)
        .filter(
            Post.id == post_id,
            Post.user_id == current_user.id,
        )
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found.",
        )

    # ------------------------------------------------------
    # Validate recurring post
    # ------------------------------------------------------

    if data.is_recurring:

        if data.scheduled_at is None:
            raise HTTPException(
                status_code=400,
                detail="Recurring posts must have a scheduled time.",
            )

        if data.recurrence_type not in [
            "daily",
            "weekly",
            "monthly",
        ]:
            raise HTTPException(
                status_code=400,
                detail="Recurrence type must be daily, weekly, or monthly.",
            )

        if data.recurrence_end_date is not None:
            if data.recurrence_end_date <= data.scheduled_at:
                raise HTTPException(
                    status_code=400,
                    detail="Recurrence end date must be after the scheduled time.",
                )

    # ------------------------------------------------------
    # Validate scheduled time
    # ------------------------------------------------------

    if data.scheduled_at is not None:

        scheduled_time = data.scheduled_at

        if scheduled_time.tzinfo is None:
            scheduled_time = scheduled_time.replace(
                tzinfo=timezone.utc
            )

        if scheduled_time <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Scheduled time must be in the future.",
            )

        post.status = "scheduled"

    else:
        post.status = "draft"

    # ------------------------------------------------------
    # Update social accounts only when provided
    # ------------------------------------------------------

    if data.social_account_ids is not None:

        social_account_ids = data.social_account_ids

        social_accounts = []

        if social_account_ids:

            social_accounts = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.id.in_(social_account_ids),
                    SocialAccount.user_id == current_user.id,
                    SocialAccount.status == "connected",
                )
                .all()
            )

            if len(social_accounts) != len(
                set(social_account_ids)
            ):
                raise HTTPException(
                    status_code=400,
                    detail="One or more selected social accounts are invalid.",
                )

        post.social_accounts = social_accounts

    # ------------------------------------------------------
    # Update post fields
    # ------------------------------------------------------

    post.content = data.content
    post.media_url = data.media_url
    post.campaign_id = data.campaign_id
    post.scheduled_at = data.scheduled_at
    post.is_recurring = data.is_recurring
    post.recurrence_type = data.recurrence_type
    post.recurrence_end_date = data.recurrence_end_date

    db.commit()
    db.refresh(post)

    return post


# ==========================================================
# DELETE POST
# ==========================================================

@router.delete(
    "/{post_id}",
)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = (
        db.query(Post)
        .filter(
            Post.id == post_id,
            Post.user_id == current_user.id,
        )
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found.",
        )

    db.delete(post)
    db.commit()

    return {
        "success": True,
        "message": "Post deleted successfully.",
        "post_id": post_id,
    }