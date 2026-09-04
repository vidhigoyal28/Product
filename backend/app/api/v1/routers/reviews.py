from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.inspection import Inspection
from app.models.review import Review
from app.models.enums import UserRole, ReviewActionType
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/reviews", tags=["Human Review & Auditing"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    payload: ReviewCreate,
    inspection_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{inspection_id}' not found"
        )

    prev_status = inspection.overall_status
    if payload.new_status:
        inspection.overall_status = payload.new_status

    review = Review(
        inspection_id=inspection.id,
        reviewer_id=current_user.id,
        action_type=payload.action_type,
        previous_status=prev_status,
        new_status=payload.new_status or prev_status,
        comments=payload.comments
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    AuditService.log_event(
        db,
        action=f"REVIEW_{payload.action_type.value}",
        entity_type="Inspection",
        entity_id=inspection.id,
        user_id=current_user.id,
        details={
            "previous_status": prev_status.value if prev_status else None,
            "new_status": payload.new_status.value if payload.new_status else None,
            "comments": payload.comments
        }
    )

    return review


@router.get("/{inspection_id}", response_model=List[ReviewResponse])
def get_reviews_for_inspection(
    inspection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reviews = db.query(Review).filter(
        Review.inspection_id == inspection_id
    ).order_by(desc(Review.created_at)).all()
    return reviews
