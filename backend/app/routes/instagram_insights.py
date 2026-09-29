from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.publishing_log import PublishingLog
from app.services.instagram_insights_service import (
    fetch_instagram_insights,
)


router = APIRouter(
    prefix="/api/instagram",
    tags=["Instagram Analytics"],
)


@router.get("/insights/{publishing_log_id}")
def get_instagram_insights(
    publishing_log_id: int,
    db: Session = Depends(get_db),
):
    log = (
        db.query(PublishingLog)
        .filter(
            PublishingLog.id == publishing_log_id,
            PublishingLog.platform == "instagram",
        )
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Instagram publishing log not found.",
        )

    try:
        return fetch_instagram_insights(
            db=db,
            publishing_log=log,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )