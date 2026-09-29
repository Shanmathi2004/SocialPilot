from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
)

from sqlalchemy.orm import relationship

from app.database.connection import Base

from app.models.post import post_social_accounts


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    # ---------------------------------------------------------
    # PRIMARY KEY
    # ---------------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ---------------------------------------------------------
    # OWNER
    # ---------------------------------------------------------

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ---------------------------------------------------------
    # PLATFORM
    # ---------------------------------------------------------

    platform = Column(
        String(50),
        nullable=False,
        index=True,
    )

    # ---------------------------------------------------------
    # PLATFORM ACCOUNT ID
    # ---------------------------------------------------------

    platform_user_id = Column(
        String(255),
        nullable=False,
    )

    # ---------------------------------------------------------
    # USERNAME
    # ---------------------------------------------------------

    platform_username = Column(
        String(255),
        nullable=True,
    )

    # ---------------------------------------------------------
    # DISPLAY NAME
    # ---------------------------------------------------------

    display_name = Column(
        String(255),
        nullable=True,
    )

    # ---------------------------------------------------------
    # ACCESS TOKEN
    # ---------------------------------------------------------

    access_token = Column(
        Text,
        nullable=False,
    )

    # ---------------------------------------------------------
    # REFRESH TOKEN
    # ---------------------------------------------------------

    refresh_token = Column(
        Text,
        nullable=True,
    )

    # ---------------------------------------------------------
    # TOKEN EXPIRY
    # ---------------------------------------------------------

    token_expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ---------------------------------------------------------
    # STATUS
    # ---------------------------------------------------------

    status = Column(
        String(50),
        nullable=False,
        default="connected",
    )

    # ---------------------------------------------------------
    # CREATED
    # ---------------------------------------------------------
    followers_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    previous_followers_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    followers_updated_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ---------------------------------------------------------
    # UPDATED
    # ---------------------------------------------------------

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ---------------------------------------------------------
    # USER RELATIONSHIP
    # ---------------------------------------------------------

    user = relationship(
        "User",
        back_populates="social_accounts",
    )

    # ---------------------------------------------------------
    # POST RELATIONSHIP
    # ---------------------------------------------------------

    posts = relationship(
        "Post",
        secondary=post_social_accounts,
        back_populates="social_accounts",
    )