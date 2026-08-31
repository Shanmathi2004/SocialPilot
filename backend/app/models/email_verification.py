from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database.connection import Base


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    code = Column(
        String(6),
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    used = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )