from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.database.connection import SessionLocal
from app.models.post import Post
from app.tasks.publishing_tasks import publish_post_task


scheduler = BackgroundScheduler(timezone="UTC")


def process_scheduled_posts():
    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        posts = (
            db.query(Post)
            .filter(
                Post.status == "scheduled",
                Post.scheduled_at <= now,
            )
            .all()
        )

        for post in posts:
            publish_post_task.delay(post.id)

    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        process_scheduled_posts,
        "interval",
        minutes=1,
        id="process_scheduled_posts",
        replace_existing=True,
    )

    scheduler.start()