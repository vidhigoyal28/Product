from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.models.enums import DeclarationStatus


class BoundingBox(BaseModel):
    x: float = Field(..., description="X coordinate or percentage")
    y: float = Field(..., description="Y coordinate or percentage")
    width: float = Field(..., description="Width")
    height: float = Field(..., description="Height")
    unit: str = Field("percent", description="'percent' or 'pixel'")


class DeclarationBase(BaseModel):
    field_name: str
    raw_text: Optional[str] = None
    normalized_value: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=100.0)
    source_image_id: Optional[str] = None
    bounding_box: Optional[Dict[str, Any]] = None


class DeclarationCreate(DeclarationBase):
    inspection_id: str
    status: DeclarationStatus = DeclarationStatus.DETECTED
    is_verified: bool = False


class DeclarationUpdate(BaseModel):
    normalized_value: Optional[str] = None
    raw_text: Optional[str] = None
    status: Optional[DeclarationStatus] = None
    is_verified: Optional[bool] = None
    bounding_box: Optional[Dict[str, Any]] = None


class DeclarationResponse(DeclarationBase):
    id: str
    inspection_id: str
    status: DeclarationStatus
    is_verified: bool
    verified_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
