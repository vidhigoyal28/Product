from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.enums import ReviewActionType, OverallStatus
from app.schemas.auth import UserResponse


class ReviewCreate(BaseModel):
    action_type: ReviewActionType = ReviewActionType.SIGN_OFF
    new_status: Optional[OverallStatus] = None
    comments: str = Field(..., min_length=2)


class ReviewResponse(BaseModel):
    id: str
    inspection_id: str
    reviewer_id: str
    reviewer: Optional[UserResponse] = None
    action_type: ReviewActionType
    previous_status: Optional[OverallStatus] = None
    new_status: Optional[OverallStatus] = None
    comments: str
    created_at: datetime

    class Config:
        from_attributes = True
