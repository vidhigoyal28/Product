from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.models.enums import ImageType, ImageQualityStatus


class ImageQualityAssessment(BaseModel):
    quality_status: ImageQualityStatus
    sharpness_score: float = 0.0
    glare_detected: bool = False
    skew_angle_deg: float = 0.0
    resolution: Optional[str] = None
    remarks: Optional[str] = None


class InspectionImageResponse(BaseModel):
    id: str
    inspection_id: str
    image_type: ImageType
    file_name: str
    file_size_bytes: int
    mime_type: str
    url: str
    quality_status: ImageQualityStatus
    quality_metrics: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
