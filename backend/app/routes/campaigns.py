from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.campaign import Campaign
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignResponse
from app.security.dependencies import get_current_user


router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"],
)


@router.post(
    "",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.start_date and data.end_date:
        if data.end_date <= data.start_date:
            raise HTTPException(
                status_code=400,
                detail="End date must be after the start date.",
            )

    campaign = Campaign(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        status=data.status,
        start_date=data.start_date,
        end_date=data.end_date,
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return campaign


@router.get(
    "",
    response_model=list[CampaignResponse],
)
def get_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaigns = (
        db.query(Campaign)
        .filter(Campaign.user_id == current_user.id)
        .order_by(Campaign.created_at.desc())
        .all()
    )

    return campaigns