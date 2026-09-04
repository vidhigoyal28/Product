from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.enums import InspectionStatus, OverallStatus
from app.schemas.auth import UserResponse
from app.schemas.image import InspectionImageResponse
from app.schemas.declaration import DeclarationResponse
from app.schemas.compliance import ComplianceFindingResponse
from app.schemas.review import ReviewResponse


class InspectionBase(BaseModel):
    product_name: str = Field(..., min_length=2, max_length=255)
    brand_name: Optional[str] = None
    category: str = Field(..., min_length=2, max_length=100)
    package_type: str = Field("Standard Pre-packaged", max_length=100)
    is_imported: bool = False
    reference_id: Optional[str] = None
    notes: Optional[str] = None


class InspectionCreate(InspectionBase):
    pass


class InspectionUpdate(BaseModel):
    product_name: Optional[str] = None
    brand_name: Optional[str] = None
    category: Optional[str] = None
    package_type: Optional[str] = None
    is_imported: Optional[bool] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[InspectionStatus] = None
    overall_status: Optional[OverallStatus] = None


class InspectionResponse(InspectionBase):
    id: str
    inspection_code: str
    status: InspectionStatus
    overall_status: OverallStatus
    confidence_score: float
    officer_id: str
    officer: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InspectionDetailResponse(InspectionResponse):
    images: List[InspectionImageResponse] = []
    declarations: List[DeclarationResponse] = []
    findings: List[ComplianceFindingResponse] = []
    reviews: List[ReviewResponse] = []


class InspectionListFilter(BaseModel):
    status: Optional[InspectionStatus] = None
    overall_status: Optional[OverallStatus] = None
    category: Optional[str] = None
    is_imported: Optional[bool] = None
    search: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
