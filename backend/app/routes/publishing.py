
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.post import Post
from app.models.user import User
from app.security.dependencies import get_current_user
from app.services.publishing_service import publish_post


router = APIRouter(
    prefix="/api/publishing",
    tags=["Publishing"],
)


# ============================================================
# PUBLISH POST NOW
# ============================================================

@router.post("/publish/{post_id}")
def publish_post_now(
    post_id: int,
    platform: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the post belonging to the logged-in user
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

    # Check whether the post can be published
    if post.status not in ["scheduled", "draft"]:
        raise HTTPException(
            status_code=400,
            detail="Only draft or scheduled posts can be published.",
        )

    # Publish the post immediately
    result = publish_post(
        db=db,
        post_id=post.id,
        platform=platform,
    )

    # Return the actual publishing error
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get(
                "message",
                "Publishing failed.",
            ),
        )

    return result


# ============================================================
# PROCESS SCHEDULED POSTS
# ============================================================

@router.post("/process-scheduled")
def process_scheduled_posts(
    db: Session = Depends(get_db),
):
    """
    Find scheduled posts whose scheduled time has arrived
    and publish them.
    """

    now = datetime.now(timezone.utc)

    scheduled_posts = (
        db.query(Post)
        .filter(
            Post.status == "scheduled",
            Post.scheduled_at <= now,
        )
        .all()
    )

    results = []

    for post in scheduled_posts:

        result = publish_post(
            db=db,
            post_id=post.id,
            platform=None,
        )

        results.append(
            {
                "post_id": post.id,
                "result": result,
            }
        )

    return {
        "success": True,
        "processed_count": len(scheduled_posts),
        "results": results,
    }

