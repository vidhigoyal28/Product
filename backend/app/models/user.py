import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.INSPECTOR, nullable=False)
    badge_number = Column(String(50), nullable=True)
    zone_division = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    inspections = relationship("Inspection", back_populates="officer", foreign_keys="Inspection.officer_id")
    reviews = relationship("Review", back_populates="reviewer", foreign_keys="Review.reviewer_id")
    reports_generated = relationship("Report", back_populates="generated_by", foreign_keys="Report.generated_by_id")
