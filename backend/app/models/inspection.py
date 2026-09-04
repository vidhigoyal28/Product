import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import InspectionStatus, OverallStatus


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_code = Column(String(50), unique=True, nullable=False, index=True)
    reference_id = Column(String(100), nullable=True, index=True)
    product_name = Column(String(255), nullable=False)
    brand_name = Column(String(150), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    package_type = Column(String(100), default="Standard Pre-packaged", nullable=False)
    is_imported = Column(Boolean, default=False, nullable=False)
    status = Column(SQLEnum(InspectionStatus), default=InspectionStatus.DRAFT, nullable=False)
    overall_status = Column(SQLEnum(OverallStatus), default=OverallStatus.NEEDS_REVIEW, nullable=False)
    confidence_score = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)

    officer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    officer = relationship("User", back_populates="inspections", foreign_keys=[officer_id])
    images = relationship("InspectionImage", back_populates="inspection", cascade="all, delete-orphan")
    declarations = relationship("Declaration", back_populates="inspection", cascade="all, delete-orphan")
    findings = relationship("ComplianceFinding", back_populates="inspection", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="inspection", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="inspection", cascade="all, delete-orphan")
