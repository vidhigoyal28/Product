import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, JSON, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import ComplianceResult


class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(String(36), ForeignKey("rules.id", ondelete="RESTRICT"), nullable=True)
    
    field = Column(String(100), nullable=False, index=True)
    result = Column(SQLEnum(ComplianceResult), default=ComplianceResult.NEEDS_REVIEW, nullable=False, index=True)
    reason = Column(Text, nullable=False)
    
    evidence_image_id = Column(String(36), ForeignKey("inspection_images.id", ondelete="SET NULL"), nullable=True)
    bounding_box = Column(JSON, nullable=True) # { "x": 10, "y": 20, "width": 30, "height": 15 }
    confidence = Column(Float, default=0.0, nullable=False)
    rule_version = Column(String(50), default="2011.1", nullable=False)
    
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    inspection = relationship("Inspection", back_populates="findings")
    rule = relationship("Rule", back_populates="findings")
    evidence_image = relationship("InspectionImage", foreign_keys=[evidence_image_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
