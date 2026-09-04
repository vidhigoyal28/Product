from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.inspection import Inspection
from app.models.declaration import Declaration
from app.models.finding import ComplianceFinding
from app.models.enums import ComplianceResult, OverallStatus
from app.schemas.compliance import ComplianceEvaluationResponse, ComplianceFindingResponse
from app.services.compliance.rule_repository import RuleRepository
from app.services.compliance.evaluator import ApplicabilityEvaluator
from app.services.compliance.validators import ValidationEngine


class ComplianceEngine:
    """
    Core Compliance Engine adhering strictly to the architecture:
    Rule data -> Applicability evaluator -> Validation engine -> Compliance finding
    """

    def __init__(self):
        self.evaluator = ApplicabilityEvaluator()
        self.validator = ValidationEngine()

    async def evaluate_inspection(
        self,
        db: Session,
        inspection_id: str,
        rule_version: Optional[str] = None
    ) -> ComplianceEvaluationResponse:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        # 1. Ensure safe rule schemas are initialized in DB
        RuleRepository.seed_initial_rules(db)

        # 2. Rule Data: Retrieve active versioned rules from repository
        rules = RuleRepository.get_active_rules(db, version=rule_version)

        # Retrieve all extracted declarations for this inspection
        declarations = db.query(Declaration).filter(Declaration.inspection_id == inspection_id).all()
        decl_map = {d.field_name: d for d in declarations}

        # Clear existing unverified findings for clean re-evaluation
        db.query(ComplianceFinding).filter(
            ComplianceFinding.inspection_id == inspection_id,
            ComplianceFinding.is_verified == False
        ).delete()

        passed = 0
        failed = 0
        needs_review = 0
        not_applicable = 0
        findings: List[ComplianceFinding] = []
        confidences: List[float] = []

        for rule in rules:
            # 3. Applicability Evaluator: Evaluate category, package type, import status, exceptions
            is_applicable, applicability_reason = self.evaluator.evaluate_applicability(rule, inspection)

            target_field = (rule.validation_parameters or {}).get("target_field") or "general"
            declaration = decl_map.get(target_field)

            if not is_applicable:
                result = ComplianceResult.NOT_APPLICABLE
                reason = applicability_reason
                conf = 100.0
                not_applicable += 1
            else:
                # 4. Validation Engine: Execute validation logic
                result, reason, conf = self.validator.execute_validation(
                    rule.validation_type,
                    declaration,
                    rule.validation_parameters or {}
                )
                if result == ComplianceResult.PASS:
                    passed += 1
                elif result == ComplianceResult.FAIL:
                    failed += 1
                elif result == ComplianceResult.NEEDS_REVIEW:
                    needs_review += 1
                confidences.append(conf)

            # 5. Compliance Finding: Construct and persist finding record
            finding = ComplianceFinding(
                inspection_id=inspection_id,
                rule_id=rule.id,
                field=target_field,
                result=result,
                reason=reason,
                evidence_image_id=declaration.source_image_id if declaration else None,
                bounding_box=declaration.bounding_box if declaration else None,
                confidence=conf,
                rule_version=rule.version,
                is_verified=False
            )
            db.add(finding)
            findings.append(finding)

        db.commit()

        # Determine overall verdict
        if failed > 0:
            overall = OverallStatus.NON_COMPLIANT
        elif needs_review > 0:
            overall = OverallStatus.NEEDS_REVIEW
        else:
            overall = OverallStatus.COMPLIANT

        overall_conf = round(sum(confidences) / len(confidences), 1) if confidences else 95.0

        # Update inspection summary status
        inspection.overall_status = overall
        inspection.confidence_score = overall_conf
        db.commit()

        # Build response DTOs
        response_findings = [ComplianceFindingResponse.from_orm(f) for f in findings]

        return ComplianceEvaluationResponse(
            inspection_id=inspection_id,
            overall_status=overall,
            confidence_score=overall_conf,
            total_rules_evaluated=len(rules),
            passed_count=passed,
            failed_count=failed,
            needs_review_count=needs_review,
            not_applicable_count=not_applicable,
            findings=response_findings
        )


_engine_instance: Optional[ComplianceEngine] = None


def get_compliance_engine() -> ComplianceEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = ComplianceEngine()
    return _engine_instance
