import uuid
import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.inspection import Inspection
from app.models.image import InspectionImage
from app.models.enums import UserRole, InspectionStatus, OverallStatus, ImageType, ImageQualityStatus
from app.schemas.inspection import (
    InspectionCreate,
    InspectionUpdate,
    InspectionResponse,
    InspectionDetailResponse,
)
from app.schemas.image import InspectionImageResponse
from app.services.storage.factory import get_storage_service
from app.services.audit_service import AuditService

router = APIRouter(prefix="/inspections", tags=["Inspections"])


def generate_unique_inspection_code() -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    rand_num = random.randint(1000, 9999)
    return f"INSP-{date_str}-{rand_num}"


@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(
    payload: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    code = generate_unique_inspection_code()
    
    # Ensure unique inspection code
    while db.query(Inspection).filter(Inspection.inspection_code == code).first():
        code = generate_unique_inspection_code()

    ref_id = payload.reference_id or f"REF-LMC-{code.replace('INSP-', '')}"

    inspection = Inspection(
        inspection_code=code,
        reference_id=ref_id,
        product_name=payload.product_name,
        brand_name=payload.brand_name,
        category=payload.category,
        package_type=payload.package_type,
        is_imported=payload.is_imported,
        notes=payload.notes,
        status=InspectionStatus.DRAFT,
        overall_status=OverallStatus.NEEDS_REVIEW,
        confidence_score=0.0,
        officer_id=current_user.id
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    AuditService.log_event(
        db,
        action="INSPECTION_CREATED",
        entity_type="Inspection",
        entity_id=inspection.id,
        user_id=current_user.id,
        details={"inspection_code": code, "product_name": payload.product_name}
    )

    return inspection


@router.get("", response_model=List[InspectionResponse])
def list_inspections(
    status: Optional[InspectionStatus] = None,
    overall_status: Optional[OverallStatus] = None,
    category: Optional[str] = None,
    is_imported: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Inspection)

    if status:
        query = query.filter(Inspection.status == status)
    if overall_status:
        query = query.filter(Inspection.overall_status == overall_status)
    if category and category != "ALL":
        query = query.filter(Inspection.category == category)
    if is_imported is not None:
        query = query.filter(Inspection.is_imported == is_imported)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Inspection.product_name.ilike(s)) |
            (Inspection.inspection_code.ilike(s)) |
            (Inspection.reference_id.ilike(s)) |
            (Inspection.brand_name.ilike(s))
        )

    offset = (page - 1) * page_size
    inspections = query.order_by(desc(Inspection.created_at)).offset(offset).limit(page_size).all()
    return inspections


@router.get("/{id}", response_model=InspectionDetailResponse)
def get_inspection(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(
        (Inspection.id == id) | (Inspection.inspection_code == id)
    ).first()

    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{id}' not found"
        )
    return inspection


@router.put("/{id}", response_model=InspectionResponse)
def update_inspection(
    id: str,
    payload: InspectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{id}' not found"
        )

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(inspection, field, value)

    db.commit()
    db.refresh(inspection)

    AuditService.log_event(
        db,
        action="INSPECTION_UPDATED",
        entity_type="Inspection",
        entity_id=inspection.id,
        user_id=current_user.id
    )

    return inspection


@router.post("/{id}/images", response_model=InspectionImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_inspection_image(
    id: str,
    file: UploadFile = File(...),
    image_type: ImageType = Form(ImageType.PDP),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{id}' not found"
        )

    content = await file.read()
    storage = get_storage_service()

    storage_res = await storage.save_file(
        file_content=content,
        original_filename=file.filename or "package_image.jpg",
        subfolder=f"inspections/{inspection.id}",
        mime_type=file.content_type
    )

    image = InspectionImage(
        inspection_id=inspection.id,
        image_type=image_type,
        file_path=storage_res.file_path,
        file_name=storage_res.file_name,
        file_size_bytes=storage_res.file_size_bytes,
        mime_type=storage_res.mime_type,
        quality_status=ImageQualityStatus.UNASSESSED,
    )
    db.add(image)
    db.commit()
    db.refresh(image)

    AuditService.log_event(
        db,
        action="IMAGE_UPLOADED",
        entity_type="InspectionImage",
        entity_id=image.id,
        user_id=current_user.id,
        details={"file_name": image.file_name, "image_type": image_type.value}
    )

    return InspectionImageResponse(
        id=image.id,
        inspection_id=image.inspection_id,
        image_type=image.image_type,
        file_name=image.file_name,
        file_size_bytes=image.file_size_bytes,
        mime_type=image.mime_type,
        url=storage_res.url,
        quality_status=image.quality_status,
        quality_metrics=image.quality_metrics,
        created_at=image.created_at
    )
