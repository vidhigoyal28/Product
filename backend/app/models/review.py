import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import ReviewActionType, OverallStatus


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    action_type = Column(SQLEnum(ReviewActionType), default=ReviewActionType.SIGN_OFF, nullable=False)
    previous_status = Column(SQLEnum(OverallStatus), nullable=True)
    new_status = Column(SQLEnum(OverallStatus), nullable=True)
    comments = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    inspection = relationship("Inspection", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews", foreign_keys=[reviewer_id])
