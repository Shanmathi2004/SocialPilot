from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # The SocialPilot user who owns this social account
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Platform name
    # Example: instagram, facebook, linkedin, youtube, x
    platform = Column(
        String(50),
        nullable=False,
        index=True,
    )

    # ID provided by the social media platform
    platform_user_id = Column(
        String(255),
        nullable=False,
    )

    # Username/page/channel name from the platform
    platform_username = Column(
        String(255),
        nullable=True,
    )

    # Display name
    display_name = Column(
        String(255),
        nullable=True,
    )

    # OAuth access token
    access_token = Column(
        Text,
        nullable=False,
    )

    # OAuth refresh token
    refresh_token = Column(
        Text,
        nullable=True,
    )

    # When the access token expires
    token_expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Account connection status
    # connected / disconnected / expired
    status = Column(
        String(50),
        nullable=False,
        default="connected",
    )

    # Created time
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Updated time
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship with User
    user = relationship(
        "User",
        back_populates="social_accounts",
    )