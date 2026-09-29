from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class PublishingLog(Base):
    __tablename__ = "publishing_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    post_id = Column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    social_account_id = Column(
        Integer,
        ForeignKey("social_accounts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    platform = Column(
        String(50),
        nullable=False,
    )

    # --------------------------------------------------
    # Platform media ID
    # --------------------------------------------------

    platform_media_id = Column(
        String(255),
        nullable=True,
        index=True,
    )

    status = Column(
        String(50),
        nullable=False,
    )

    published_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    error_message = Column(
        Text,
        nullable=True,
    )

    # --------------------------------------------------
    # Engagement metrics
    # --------------------------------------------------

    likes = Column(
        Integer,
        nullable=True,
        default=0,
    )

    comments = Column(
        Integer,
        nullable=True,
        default=0,
    )

    shares = Column(
        Integer,
        nullable=True,
        default=0,
    )

    reach = Column(
        Integer,
        nullable=True,
        default=0,
    )

    views = Column(
        Integer,
        nullable=True,
        default=0,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    post = relationship(
        "Post",
        back_populates="publishing_logs",
    )

    social_account = relationship(
        "SocialAccount",
    )