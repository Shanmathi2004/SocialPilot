from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal, get_db
from app.models.post import Post
from app.models.user import User
from app.security.dependencies import get_current_user
from app.services.publishing_service import publish_post


router = APIRouter(
    prefix="/api/publishing",
    tags=["Publishing"],
)


def run_publishing_task(
    post_id: int,
    platform: str,
):
    db = SessionLocal()

    try:
        publish_post(
            db=db,
            post_id=post_id,
            platform=platform,
        )
    finally:
        db.close()


@router.post("/publish/{post_id}")
def publish_post_in_background(
    post_id: int,
    background_tasks: BackgroundTasks,
    platform: str = "instagram",
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

    if post.status not in ["scheduled", "draft"]:
        raise HTTPException(
            status_code=400,
            detail="Only draft or scheduled posts can be published.",
        )

    background_tasks.add_task(
        run_publishing_task,
        post.id,
        platform,
    )

    return {
        "message": "Publishing task added to the background queue.",
        "post_id": post.id,
        "platform": platform,
    }