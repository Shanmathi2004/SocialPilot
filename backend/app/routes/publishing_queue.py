from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.post import Post
from app.models.user import User
from app.security.dependencies import get_current_user


router = APIRouter(
    prefix="/api/publishing-queue",
    tags=["Publishing Queue"],
)


@router.get("")
def get_publishing_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = (
        db.query(Post)
        .filter(
            Post.user_id == current_user.id,
            Post.status.in_(["scheduled", "queued", "processing"]),
        )
        .order_by(Post.scheduled_at.asc())
        .all()
    )

    return [
        {
            "id": post.id,
            "content": post.content,
            "status": post.status,
            "scheduled_at": post.scheduled_at,
            "is_recurring": post.is_recurring,
            "recurrence_type": post.recurrence_type,
        }
        for post in posts
    ]