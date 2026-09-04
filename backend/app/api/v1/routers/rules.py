from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.rule import Rule
from app.models.enums import UserRole
from app.schemas.rule import RuleCreate, RuleUpdate, RuleResponse
from app.services.compliance.rule_repository import RuleRepository
from app.services.audit_service import AuditService

router = APIRouter(prefix="/rules", tags=["Rules Repository"])


@router.get("", response_model=List[RuleResponse])
def list_rules(
    version: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure seed rules exist
    RuleRepository.seed_initial_rules(db)

    query = db.query(Rule)
    if version:
        query = query.filter(Rule.version == version)
    if is_active is not None:
        query = query.filter(Rule.is_active == is_active)

    return query.all()


@router.get("/{id}", response_model=RuleResponse)
def get_rule(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(Rule).filter((Rule.id == id) | (Rule.rule_id == id)).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule '{id}' not found"
        )
    return rule


@router.post(
    "",
    response_model=RuleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.REVIEWER]))]
)
def create_rule(
    payload: RuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Rule).filter(Rule.rule_id == payload.rule_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rule ID '{payload.rule_id}' already exists."
        )

    rule = Rule(**payload.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)

    AuditService.log_event(
        db,
        action="RULE_CREATED",
        entity_type="Rule",
        entity_id=rule.id,
        user_id=current_user.id,
        details={"rule_id": rule.rule_id, "requirement": rule.requirement}
    )

    return rule


@router.put(
    "/{id}",
    response_model=RuleResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.REVIEWER]))]
)
def update_rule(
    id: str,
    payload: RuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(Rule).filter(Rule.id == id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule '{id}' not found"
        )

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)

    AuditService.log_event(
        db,
        action="RULE_UPDATED",
        entity_type="Rule",
        entity_id=rule.id,
        user_id=current_user.id
    )

    return rule
