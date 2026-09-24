from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
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

    platform = Column(
        String(50),
        nullable=False,
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

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    post = relationship(
        "Post",
        back_populates="publishing_logs",
    )