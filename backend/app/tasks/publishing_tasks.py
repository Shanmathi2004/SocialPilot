from app.celery_app import celery_app
from app.database.connection import SessionLocal
from app.services.publishing_service import publish_post


@celery_app.task
def publish_post_task(post_id: int):
    db = SessionLocal()

    try:
        return publish_post(
            db=db,
            post_id=post_id,
            platform=None,
        )
    finally:
        db.close()