from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.declaration import Declaration
from app.models.enums import DeclarationStatus
from app.schemas.declaration import (
    DeclarationCreate,
    DeclarationUpdate,
    DeclarationResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/declarations", tags=["Declarations"])


@router.get("", response_model=List[DeclarationResponse])
def list_declarations(
    inspection_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    declarations = db.query(Declaration).filter(Declaration.inspection_id == inspection_id).all()
    return declarations


@router.post("", response_model=DeclarationResponse, status_code=status.HTTP_201_CREATED)
def create_declaration(
    payload: DeclarationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    declaration = Declaration(
        inspection_id=payload.inspection_id,
        field_name=payload.field_name,
        raw_text=payload.raw_text,
        normalized_value=payload.normalized_value,
        confidence=payload.confidence,
        source_image_id=payload.source_image_id,
        bounding_box=payload.bounding_box,
        status=payload.status,
        is_verified=payload.is_verified,
        verified_by_id=current_user.id if payload.is_verified else None
    )
    db.add(declaration)
    db.commit()
    db.refresh(declaration)

    return declaration


@router.put("/{id}", response_model=DeclarationResponse)
def update_declaration(
    id: str,
    payload: DeclarationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    declaration = db.query(Declaration).filter(Declaration.id == id).first()
    if not declaration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Declaration '{id}' not found"
        )

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(declaration, field, value)

    if payload.is_verified or payload.status == DeclarationStatus.VERIFIED:
        declaration.is_verified = True
        declaration.verified_by_id = current_user.id
        declaration.status = DeclarationStatus.VERIFIED

    db.commit()
    db.refresh(declaration)

    AuditService.log_event(
        db,
        action="DECLARATION_EDITED",
        entity_type="Declaration",
        entity_id=declaration.id,
        user_id=current_user.id,
        details={"field_name": declaration.field_name, "value": declaration.normalized_value}
    )

    return declaration


@router.post("/{id}/verify", response_model=DeclarationResponse)
def verify_declaration(
    id: str,
    action: str = Query("ACCEPT", pattern="^(ACCEPT|REJECT|EDIT)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    declaration = db.query(Declaration).filter(Declaration.id == id).first()
    if not declaration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Declaration '{id}' not found"
        )

    if action == "ACCEPT":
        declaration.status = DeclarationStatus.VERIFIED
        declaration.is_verified = True
        declaration.verified_by_id = current_user.id
    elif action == "REJECT":
        declaration.status = DeclarationStatus.REJECTED
        declaration.is_verified = True
        declaration.verified_by_id = current_user.id

    db.commit()
    db.refresh(declaration)

    AuditService.log_event(
        db,
        action=f"DECLARATION_{action}",
        entity_type="Declaration",
        entity_id=declaration.id,
        user_id=current_user.id
    )

    return declaration
