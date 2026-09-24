from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.post import Post
from app.models.publishing_log import PublishingLog
from app.models.user import User
from app.schemas.publishing_log import (
    PublishingLogCreate,
    PublishingLogResponse,
)
from app.security.dependencies import get_current_user


router = APIRouter(
    prefix="/api/publishing-logs",
    tags=["Publishing Logs"],
)


@router.post(
    "",
    response_model=PublishingLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_publishing_log(
    data: PublishingLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the post
    post = (
        db.query(Post)
        .filter(
            Post.id == data.post_id,
            Post.user_id == current_user.id,
        )
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found.",
        )

    # Set published time when publishing succeeds
    published_at = None

    if data.status == "published":
        published_at = datetime.now(timezone.utc)

    log = PublishingLog(
        post_id=data.post_id,
        platform=data.platform,
        status=data.status,
        published_at=published_at,
        error_message=data.error_message,
    )

    db.add(log)

    # Update the post status
    if data.status == "published":
        post.status = "published"

    elif data.status == "failed":
        post.status = "failed"

    db.commit()
    db.refresh(log)

    return log


@router.get(
    "",
    response_model=list[PublishingLogResponse],
)
def get_publishing_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = (
        db.query(PublishingLog)
        .join(Post, PublishingLog.post_id == Post.id)
        .filter(Post.user_id == current_user.id)
        .order_by(PublishingLog.created_at.desc())
        .all()
    )

    return logs