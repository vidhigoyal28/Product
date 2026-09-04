import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import ImageType, ImageQualityStatus


class InspectionImage(Base):
    __tablename__ = "inspection_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    image_type = Column(SQLEnum(ImageType), default=ImageType.PDP, nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), default="image/jpeg", nullable=False)
    
    # Image Quality Assessment
    quality_status = Column(SQLEnum(ImageQualityStatus), default=ImageQualityStatus.UNASSESSED, nullable=False)
    quality_metrics = Column(JSON, nullable=True) # { "sharpness": 88.5, "glare_detected": false, "skew_deg": 1.2, "dimensions": [1920, 1080] }

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    inspection = relationship("Inspection", back_populates="images")
    declarations = relationship("Declaration", back_populates="source_image")

    @property
    def url(self) -> str:
        clean_rel = (self.file_path or "").replace("\\", "/")
        return f"/uploads/{clean_rel}"
