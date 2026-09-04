import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, JSON, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import DeclarationStatus


class Declaration(Base):
    __tablename__ = "declarations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    
    field_name = Column(String(100), nullable=False, index=True) # e.g. "commodity_name", "net_quantity", "mrp", "manufacturer_details"
    raw_text = Column(Text, nullable=True)                       # Exact OCR text
    normalized_value = Column(Text, nullable=True)               # Standardized / structured representation
    confidence = Column(Float, default=0.0, nullable=False)      # Confidence score 0 - 100
    
    source_image_id = Column(String(36), ForeignKey("inspection_images.id", ondelete="SET NULL"), nullable=True)
    bounding_box = Column(JSON, nullable=True)                   # { "x": 12.5, "y": 34.0, "width": 25.0, "height": 10.0, "unit": "percent" }
    
    status = Column(SQLEnum(DeclarationStatus), default=DeclarationStatus.DETECTED, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False) # False = AI Extracted, True = Human Verified
    verified_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    inspection = relationship("Inspection", back_populates="declarations")
    source_image = relationship("InspectionImage", back_populates="declarations")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
