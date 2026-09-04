from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.models.enums import ReportType
from app.schemas.auth import UserResponse


class ReportCreate(BaseModel):
    report_type: ReportType = ReportType.FORM_II_STATUTORY_NOTICE


class ReportResponse(BaseModel):
    id: str
    report_code: str
    inspection_id: str
    report_type: ReportType
    generated_by_id: str
    generated_by: Optional[UserResponse] = None
    summary_data: Dict[str, Any]
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
