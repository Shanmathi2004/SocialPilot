
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.campaign import Campaign
from app.models.post import Post
from app.models.user import User
from app.models.publishing_log import PublishingLog
from app.schemas.campaign import CampaignCreate, CampaignResponse
from app.security.dependencies import get_current_user


router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"],
)


# ============================================================
# CREATE CAMPAIGN
# ============================================================

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
        budget=data.budget,
        revenue=data.revenue,
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return campaign


# ============================================================
# GET ALL CAMPAIGNS
# ============================================================

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


# ============================================================
# GET SINGLE CAMPAIGN
# ============================================================

@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    return campaign


# ============================================================
# UPDATE CAMPAIGN
# ============================================================

@router.put(
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def update_campaign(
    campaign_id: int,
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    if data.start_date and data.end_date:
        if data.end_date <= data.start_date:
            raise HTTPException(
                status_code=400,
                detail="End date must be after the start date.",
            )

    campaign.name = data.name
    campaign.description = data.description
    campaign.status = data.status
    campaign.start_date = data.start_date
    campaign.end_date = data.end_date
    campaign.budget = data.budget
    campaign.revenue = data.revenue

    db.commit()
    db.refresh(campaign)

    return campaign


# ============================================================
# DELETE CAMPAIGN
# ============================================================

@router.delete(
    "/{campaign_id}",
)
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    # Remove campaign reference from posts first
    db.query(Post).filter(
        Post.campaign_id == campaign.id,
        Post.user_id == current_user.id,
    ).update(
        {"campaign_id": None},
        synchronize_session=False,
    )

    db.delete(campaign)
    db.commit()

    return {
        "success": True,
        "message": "Campaign deleted successfully.",
        "campaign_id": campaign_id,
    }


# ============================================================
# CAMPAIGN STATISTICS
# ============================================================

@router.get(
    "/{campaign_id}/stats",
)
def get_campaign_stats(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    # --------------------------------------------------------
    # Get campaign posts
    # --------------------------------------------------------

    posts = (
        db.query(Post)
        .filter(
            Post.campaign_id == campaign.id,
            Post.user_id == current_user.id,
        )
        .all()
    )

    # --------------------------------------------------------
    # Post statistics
    # --------------------------------------------------------

    total_posts = len(posts)

    draft_posts = sum(
        1
        for post in posts
        if post.status == "draft"
    )

    scheduled_posts = sum(
        1
        for post in posts
        if post.status == "scheduled"
    )

    published_posts = sum(
        1
        for post in posts
        if post.status == "published"
    )

    failed_posts = sum(
        1
        for post in posts
        if post.status == "failed"
    )

    # --------------------------------------------------------
    # Publishing statistics
    # --------------------------------------------------------

    publishing_attempts = (
        db.query(PublishingLog)
        .join(
            Post,
            PublishingLog.post_id == Post.id,
        )
        .filter(
            Post.campaign_id == campaign.id,
            Post.user_id == current_user.id,
        )
        .count()
    )

    successful_attempts = (
        db.query(PublishingLog)
        .join(
            Post,
            PublishingLog.post_id == Post.id,
        )
        .filter(
            Post.campaign_id == campaign.id,
            Post.user_id == current_user.id,
            PublishingLog.status == "published",
        )
        .count()
    )

    failed_attempts = (
        db.query(PublishingLog)
        .join(
            Post,
            PublishingLog.post_id == Post.id,
        )
        .filter(
            Post.campaign_id == campaign.id,
            Post.user_id == current_user.id,
            PublishingLog.status == "failed",
        )
        .count()
    )

    # --------------------------------------------------------
    # Success rate
    # --------------------------------------------------------

    if publishing_attempts > 0:
        success_rate = round(
            (
                successful_attempts
                / publishing_attempts
            )
            * 100,
            2,
        )
    else:
        success_rate = 0

    # --------------------------------------------------------
    # ROI
    # --------------------------------------------------------

    budget = campaign.budget or 0
    revenue = campaign.revenue or 0

    roi = None

    if budget > 0:
        roi = round(
            (
                (revenue - budget)
                / budget
            )
            * 100,
            2,
        )

    # --------------------------------------------------------
    # Return campaign statistics
    # --------------------------------------------------------

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "campaign_status": campaign.status,

        "total_posts": total_posts,
        "draft_posts": draft_posts,
        "scheduled_posts": scheduled_posts,
        "published_posts": published_posts,
        "failed_posts": failed_posts,

        "publishing_attempts": publishing_attempts,
        "successful_attempts": successful_attempts,
        "failed_attempts": failed_attempts,
        "success_rate": success_rate,

        "budget": budget,
        "revenue": revenue,
        "roi": roi,
    }

