import re
from typing import Dict, Any, Optional, Tuple
from app.models.enums import ComplianceResult, ValidationType
from app.models.declaration import Declaration


class BaseValidator:
    """Base generic declaration validator."""
    @staticmethod
    def validate(declaration: Optional[Declaration], parameters: Dict[str, Any]) -> Tuple[ComplianceResult, str, float]:
        raise NotImplementedError


class PresenceValidator(BaseValidator):
    """Validates that mandatory statutory declaration text is present and non-empty."""

    @staticmethod
    def validate(declaration: Optional[Declaration], parameters: Dict[str, Any]) -> Tuple[ComplianceResult, str, float]:
        if not declaration or not declaration.normalized_value or not declaration.normalized_value.strip():
            return ComplianceResult.FAIL, "Mandatory statutory declaration is missing or not detected on display panel.", 0.0

        conf = declaration.confidence or 0.0
        if conf < 65.0:
            return ComplianceResult.NEEDS_REVIEW, f"Declaration is present but has low OCR confidence ({conf:.1f}%). Officer review required.", conf

        return ComplianceResult.PASS, f"Statutory declaration is present ({declaration.normalized_value}).", conf


class RegexValidator(BaseValidator):
    """Validates declaration text against defined statutory regex pattern."""

    @staticmethod
    def validate(declaration: Optional[Declaration], parameters: Dict[str, Any]) -> Tuple[ComplianceResult, str, float]:
        if not declaration or not declaration.normalized_value:
            return ComplianceResult.FAIL, "Declaration is missing for regex format validation.", 0.0

        pattern = parameters.get("pattern")
        if not pattern:
            return ComplianceResult.PASS, "Declaration present (no specific regex constraint).", declaration.confidence

        text_to_test = f"{declaration.raw_text or ''} {declaration.normalized_value or ''}".strip()
        flags = re.IGNORECASE if parameters.get("ignore_case", True) else 0

        if re.search(pattern, text_to_test, flags=flags):
            return ComplianceResult.PASS, f"Declaration complies with required statutory format.", declaration.confidence
        else:
            fail_reason = parameters.get("failure_message") or f"Declaration does not match statutory pattern requirement: '{pattern}'."
            return ComplianceResult.FAIL, fail_reason, declaration.confidence


class StandardUnitsValidator(BaseValidator):
    """Validates net quantity conforms to standard SI units (g, kg, ml, l, m, units)."""

    @staticmethod
    def validate(declaration: Optional[Declaration], parameters: Dict[str, Any]) -> Tuple[ComplianceResult, str, float]:
        if not declaration or not declaration.normalized_value:
            return ComplianceResult.FAIL, "Net quantity declaration is missing.", 0.0

        allowed_units = parameters.get("allowed_units", ["g", "kg", "ml", "l", "m", "cm", "mm", "unit", "u", "units", "n"])
        val_lower = declaration.normalized_value.lower()

        # Check if contains permissible unit
        has_unit = any(re.search(rf"\b{re.escape(u)}\b", val_lower) or val_lower.endswith(u) for u in allowed_units)
        if has_unit:
            return ComplianceResult.PASS, f"Net quantity uses permissible standard unit ({declaration.normalized_value}).", declaration.confidence
        else:
            return ComplianceResult.FAIL, f"Net quantity '{declaration.normalized_value}' does not use standard metric/SI units ({', '.join(allowed_units)}).", declaration.confidence


class FontSizeValidator(BaseValidator):
    """Validates font and numeral height compliance against principal display panel area."""

    @staticmethod
    def validate(declaration: Optional[Declaration], parameters: Dict[str, Any]) -> Tuple[ComplianceResult, str, float]:
        if not declaration or not declaration.normalized_value:
            return ComplianceResult.NEEDS_REVIEW, "Display area / font measurement data is not present for evaluation.", 0.0

        val = declaration.normalized_value.lower()
        if "below minimum" in val or "deficient" in val or "non-compliant" in val:
            return ComplianceResult.FAIL, "Numeral/font height is below the statutory minimum threshold for the principal display panel area.", declaration.confidence

        return ComplianceResult.PASS, "Font height and numeral proportions comply with statutory display area thresholds.", declaration.confidence


class ValidationEngine:
    """Dispatches validation tasks to the appropriate generic validator."""

    _VALIDATORS = {
        ValidationType.PRESENCE: PresenceValidator,
        ValidationType.REGEX_MATCH: RegexValidator,
        ValidationType.STANDARD_UNITS: StandardUnitsValidator,
        ValidationType.FONT_HEIGHT: FontSizeValidator,
    }

    @classmethod
    def execute_validation(
        cls,
        validation_type: ValidationType,
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:
        validator_cls = cls._VALIDATORS.get(validation_type, PresenceValidator)
        return validator_cls.validate(declaration, parameters or {})
