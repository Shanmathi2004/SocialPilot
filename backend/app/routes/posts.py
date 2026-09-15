
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.post import Post
from app.models.user import User
from app.schema.post import PostCreate, PostResponse
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
    post = Post(
        user_id=current_user.id,
        content=data.content,
        media_url=data.media_url,
        status=data.status,
        scheduled_at=data.scheduled_at,
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return post
