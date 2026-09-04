from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.enums import ReportType
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import ReportService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/reports", tags=["Reports & Statutory Notices"])


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    payload: ReportCreate,
    inspection_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        report = ReportService.generate_inspection_report(
            db,
            inspection_id=inspection_id,
            user=current_user,
            report_type=payload.report_type
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    AuditService.log_event(
        db,
        action="REPORT_GENERATED",
        entity_type="Report",
        entity_id=report.id,
        user_id=current_user.id,
        details={"report_code": report.report_code, "report_type": report.report_type.value}
    )

    return report


@router.get("", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).order_by(desc(Report.created_at)).all()
    return reports


@router.get("/{id}", response_model=ReportResponse)
def get_report(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(
        (Report.id == id) | (Report.report_code == id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{id}' not found"
        )
    return report
