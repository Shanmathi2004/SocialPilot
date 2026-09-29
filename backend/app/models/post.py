from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    Table,
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


# ---------------------------------------------------------
# POST ↔ SOCIAL ACCOUNT ASSOCIATION TABLE
# ---------------------------------------------------------

post_social_accounts = Table(
    "post_social_accounts",
    Base.metadata,
    Column(
        "post_id",
        Integer,
        ForeignKey(
            "posts.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),
    Column(
        "social_account_id",
        Integer,
        ForeignKey(
            "social_accounts.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),
)


class Post(Base):
    __tablename__ = "posts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    campaign_id = Column(
        Integer,
        ForeignKey(
            "campaigns.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    content = Column(
        Text,
        nullable=False,
    )

    media_url = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="draft",
    )

    scheduled_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    is_recurring = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    recurrence_type = Column(
        String(50),
        nullable=True,
    )

    recurrence_end_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ---------------------------------------------------------
    # USER
    # ---------------------------------------------------------

    user = relationship(
        "User",
        back_populates="posts",
    )

    # ---------------------------------------------------------
    # CAMPAIGN
    # ---------------------------------------------------------

    campaign = relationship(
        "Campaign",
        back_populates="posts",
    )

    # ---------------------------------------------------------
    # PUBLISHING LOGS
    # ---------------------------------------------------------

    publishing_logs = relationship(
        "PublishingLog",
        back_populates="post",
        cascade="all, delete-orphan",
    )

    # ---------------------------------------------------------
    # SELECTED SOCIAL ACCOUNTS
    # ---------------------------------------------------------

    social_accounts = relationship(
        "SocialAccount",
        secondary=post_social_accounts,
        back_populates="posts",
    )