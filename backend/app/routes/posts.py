from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostCreate, PostResponse
from app.security.dependencies import get_current_user


router = APIRouter(
    prefix="/api/posts",
    tags=["Posts"],
)


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
    # --------------------------------------------------
    # VALIDATE RECURRING POST
    # --------------------------------------------------

    if data.is_recurring:

        if data.scheduled_at is None:
            raise HTTPException(
                status_code=400,
                detail="Recurring posts must have a scheduled time.",
            )

        if data.recurrence_type not in ["daily", "weekly", "monthly"]:
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

    # --------------------------------------------------
    # DETERMINE POST STATUS
    # --------------------------------------------------

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

    # --------------------------------------------------
    # CREATE POST
    # --------------------------------------------------

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

    db.add(post)
    db.commit()
    db.refresh(post)

    return post


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