from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.publishing_service import publish_post


router = APIRouter(
    prefix="/api/publishing",
    tags=["Publishing"],
)


def run_publish_post(post_id: int):
    db = next(get_db())

    try:
        publish_post(
            db=db,
            post_id=post_id,
            platform=None,
        )
    finally:
        db.close()


@router.post("/background/{post_id}")
def publish_in_background(
    post_id: int,
    background_tasks: BackgroundTasks,
):
    background_tasks.add_task(
        run_publish_post,
        post_id,
    )

    return {
        "success": True,
        "message": "Publishing task started in background.",
        "post_id": post_id,
    }