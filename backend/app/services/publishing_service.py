import time

from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.publishing_log import PublishingLog


def publish_post(
    db: Session,
    post_id: int,
    platform: str = "instagram",
):
    post = (
        db.query(Post)
        .filter(Post.id == post_id)
        .first()
    )

    if not post:
        return {
            "success": False,
            "message": "Post not found.",
        }

    try:
        # --------------------------------------------------
        # TEMPORARY PUBLISHING SIMULATION
        # --------------------------------------------------
        # Later, this section will call the actual
        # Instagram / Facebook / LinkedIn / etc. API.

        time.sleep(1)

        post.status = "published"

        log = PublishingLog(
            post_id=post.id,
            platform=platform,
            status="published",
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "success": True,
            "message": "Post published successfully.",
            "post_id": post.id,
            "log_id": log.id,
        }

    except Exception as error:

        db.rollback()

        log = PublishingLog(
            post_id=post.id,
            platform=platform,
            status="failed",
            error_message=str(error),
        )

        db.add(log)
        db.commit()

        return {
            "success": False,
            "message": "Publishing failed.",
            "post_id": post.id,
        }