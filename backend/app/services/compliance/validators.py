
import re
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

from app.models.enums import ComplianceResult, ValidationType
from app.models.declaration import Declaration


class BaseValidator:
    """Base validator for a declaration against a structured rule."""

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:
        raise NotImplementedError


class PresenceValidator(BaseValidator):
    """
    Validates that a required statutory declaration is present.

    OCR uncertainty is treated conservatively:
    - Missing declaration -> FAIL
    - Low-confidence OCR -> NEEDS_REVIEW
    - Adequate confidence -> PASS
    """

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:

        if not declaration:
            return (
                ComplianceResult.FAIL,
                "Required statutory declaration was not detected.",
                0.0,
            )

        value = (declaration.normalized_value or "").strip()

        if not value:
            return (
                ComplianceResult.FAIL,
                "Required statutory declaration is missing or empty.",
                0.0,
            )

        confidence = float(declaration.confidence or 0.0)

        review_threshold = float(
            parameters.get("minimum_confidence_for_automatic_pass", 65.0)
        )

        if confidence < review_threshold:
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    f"Declaration was detected, but OCR confidence is "
                    f"only {confidence:.1f}%. Officer verification is required."
                ),
                confidence,
            )

        return (
            ComplianceResult.PASS,
            f"Required declaration detected: {value}.",
            confidence,
        )


class RegexValidator(BaseValidator):
    """
    Validates declaration text against a rule-defined regular expression.

    Intended for structured declarations such as:
    - MRP
    - consumer-care formats
    - dates
    - other statutory text patterns

    Regex failure is a compliance failure only when the declaration
    itself has been detected.
    """

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:

        if not declaration:
            return (
                ComplianceResult.FAIL,
                "Required declaration was not detected for format validation.",
                0.0,
            )

        text = (
            f"{declaration.raw_text or ''} "
            f"{declaration.normalized_value or ''}"
        ).strip()

        if not text:
            return (
                ComplianceResult.FAIL,
                "Declaration contains no readable text for format validation.",
                0.0,
            )

        pattern = parameters.get("pattern")

        if not pattern:
            return (
                ComplianceResult.PASS,
                "Declaration detected; no additional pattern constraint is configured.",
                float(declaration.confidence or 0.0),
            )

        confidence = float(declaration.confidence or 0.0)

        try:
            flags = (
                re.IGNORECASE
                if parameters.get("ignore_case", True)
                else 0
            )

            matched = re.search(pattern, text, flags=flags)

        except re.error as exc:
            return (
                ComplianceResult.NEEDS_REVIEW,
                f"Configured validation pattern could not be evaluated: {exc}.",
                confidence,
            )

        if matched:
            return (
                ComplianceResult.PASS,
                parameters.get(
                    "success_message",
                    "Declaration matches the configured statutory format.",
                ),
                confidence,
            )

        return (
            ComplianceResult.FAIL,
            parameters.get(
                "failure_message",
                "Declaration does not match the configured statutory format.",
            ),
            confidence,
        )


class StandardUnitsValidator(BaseValidator):
    """
    Validates net quantity declarations.

    The validator checks both:
      1. a numeric quantity exists
      2. an allowed unit exists

    It does not blindly accept arbitrary alphabetic suffixes.

    Example accepted forms:
      500 g
      1 kg
      250 ml
      1 L
      10 units
      12 pieces

    The actual legal applicability of the declaration is controlled
    by the rule repository/applicability evaluator.
    """

    QUANTITY_PATTERN = re.compile(
        r"""
        (?P<number>
            \d+(?:\.\d+)?
        )
        \s*
        (?P<unit>
            mg|g|kg|ml|l|mL|L|
            mm|cm|m|
            unit|units|piece|pieces|pcs|pc|number|numbers|no
        )
        \b
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:

        if not declaration:
            return (
                ComplianceResult.FAIL,
                "Net quantity declaration was not detected.",
                0.0,
            )

        value = (
            declaration.normalized_value
            or declaration.raw_text
            or ""
        ).strip()

        if not value:
            return (
                ComplianceResult.FAIL,
                "Net quantity declaration is empty.",
                0.0,
            )

        confidence = float(declaration.confidence or 0.0)

        allowed_units = parameters.get(
            "allowed_units",
            [
                "mg",
                "g",
                "kg",
                "ml",
                "l",
                "unit",
                "units",
                "piece",
                "pieces",
                "pcs",
                "number",
                "no",
            ],
        )

        normalized_allowed = {
            str(unit).strip().lower()
            for unit in allowed_units
        }

        match = StandardUnitsValidator.QUANTITY_PATTERN.search(value)

        if not match:
            return (
                ComplianceResult.FAIL,
                (
                    f"Net quantity '{value}' does not contain a valid "
                    "numeric quantity with a recognized standard unit."
                ),
                confidence,
            )

        number = match.group("number")
        unit = match.group("unit").lower()

        if unit not in normalized_allowed:
            return (
                ComplianceResult.FAIL,
                (
                    f"Net quantity uses unit '{unit}', which is not among "
                    f"the configured permissible units."
                ),
                confidence,
            )

        review_threshold = float(
            parameters.get("minimum_confidence_for_automatic_pass", 65.0)
        )

        if confidence < review_threshold:
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    f"Net quantity '{number} {unit}' was detected, but "
                    f"OCR confidence is only {confidence:.1f}%. "
                    "Officer verification is required."
                ),
                confidence,
            )

        return (
            ComplianceResult.PASS,
            f"Net quantity detected in a configured standard unit: {number} {unit}.",
            confidence,
        )


class DateValidityValidator(BaseValidator):
    """
    Validates date/month-year declarations.

    Supports common package representations such as:
      MM/YYYY
      MM-YYYY
      MM.YYYY
      DD/MM/YYYY
      DD-MM-YYYY
      DD.MM.YYYY
      YYYY-MM
      YYYY/MM

    This validator checks syntactic/date validity.
    Whether a date declaration is legally required is handled
    separately by rule applicability.
    """

    DATE_PATTERNS = [
        re.compile(r"^(0?[1-9]|1[0-2])\s*[/.-]\s*(20\d{2})$"),
        re.compile(r"^(20\d{2})\s*[/.-]\s*(0?[1-9]|1[0-2])$"),
        re.compile(
            r"^(0?[1-9]|[12]\d|3[01])\s*[/.-]\s*"
            r"(0?[1-9]|1[0-2])\s*[/.-]\s*(20\d{2})$"
        ),
    ]

    @staticmethod
    def _is_valid_date(text: str) -> bool:
        cleaned = re.sub(r"\s+", "", text)

        for pattern in DateValidityValidator.DATE_PATTERNS:
            match = pattern.match(cleaned)

            if not match:
                continue

            groups = match.groups()

            try:
                if len(groups) == 2:
                    first, second = groups

                    # YYYY-MM
                    if len(first) == 4:
                        year = int(first)
                        month = int(second)
                    else:
                        month = int(first)
                        year = int(second)

                    datetime(year=year, month=month, day=1)
                    return True

                if len(groups) == 3:
                    day = int(groups[0])
                    month = int(groups[1])
                    year = int(groups[2])

                    datetime(year=year, month=month, day=day)
                    return True

            except ValueError:
                return False

        return False

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:

        if not declaration:
            return (
                ComplianceResult.FAIL,
                "Required date declaration was not detected.",
                0.0,
            )

        value = (
            declaration.normalized_value
            or declaration.raw_text
            or ""
        ).strip()

        if not value:
            return (
                ComplianceResult.FAIL,
                "Date declaration is empty.",
                0.0,
            )

        confidence = float(declaration.confidence or 0.0)

        if not DateValidityValidator._is_valid_date(value):
            return (
                ComplianceResult.FAIL,
                f"Detected date '{value}' is not in a recognized valid date/month-year format.",
                confidence,
            )

        review_threshold = float(
            parameters.get("minimum_confidence_for_automatic_pass", 65.0)
        )

        if confidence < review_threshold:
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    f"Date '{value}' appears valid, but OCR confidence is "
                    f"{confidence:.1f}%. Officer verification is required."
                ),
                confidence,
            )

        return (
            ComplianceResult.PASS,
            f"Date declaration is in a recognized valid format: {value}.",
            confidence,
        )


class NumericRangeValidator(BaseValidator):
    """
    Generic numeric validator.

    Supports:
      minimum
      maximum
      inclusive_minimum
      inclusive_maximum

    Useful for future rule-specific numeric constraints without
    hard-coding legal thresholds into the validator.
    """

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:

        if not declaration:
            return (
                ComplianceResult.FAIL,
                "Required numeric declaration was not detected.",
                0.0,
            )

        value = (
            declaration.normalized_value
            or declaration.raw_text
            or ""
        ).strip()

        if not value:
            return (
                ComplianceResult.FAIL,
                "Numeric declaration is empty.",
                0.0,
            )

        confidence = float(declaration.confidence or 0.0)

        match = re.search(r"-?\d+(?:\.\d+)?", value)

        if not match:
            return (
                ComplianceResult.FAIL,
                f"No numeric value could be extracted from '{value}'.",
                confidence,
            )

        numeric_value = float(match.group())

        minimum = parameters.get("minimum")
        maximum = parameters.get("maximum")

        if minimum is not None:
            minimum = float(minimum)

            if parameters.get("inclusive_minimum", True):
                if numeric_value < minimum:
                    return (
                        ComplianceResult.FAIL,
                        f"Value {numeric_value} is below the configured minimum of {minimum}.",
                        confidence,
                    )
            elif numeric_value <= minimum:
                return (
                    ComplianceResult.FAIL,
                    f"Value {numeric_value} must be greater than {minimum}.",
                    confidence,
                )

        if maximum is not None:
            maximum = float(maximum)

            if parameters.get("inclusive_maximum", True):
                if numeric_value > maximum:
                    return (
                        ComplianceResult.FAIL,
                        f"Value {numeric_value} exceeds the configured maximum of {maximum}.",
                        confidence,
                    )
            elif numeric_value >= maximum:
                return (
                    ComplianceResult.FAIL,
                    f"Value {numeric_value} must be less than {maximum}.",
                    confidence,
                )

        review_threshold = float(
            parameters.get("minimum_confidence_for_automatic_pass", 65.0)
        )

        if confidence < review_threshold:
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    f"Numeric value {numeric_value} was detected, but OCR "
                    f"confidence is only {confidence:.1f}%. "
                    "Officer verification is required."
                ),
                confidence,
            )

        return (
            ComplianceResult.PASS,
            f"Numeric declaration satisfies the configured numeric constraints: {numeric_value}.",
            confidence,
        )


class FontSizeValidator(BaseValidator):
    """
    Conservative validator for legibility/font evidence.

    IMPORTANT:
    OCR bounding-box coordinates alone do NOT establish physical font
    height in millimetres unless image/package scale is known.

    Therefore:
      - explicit measured evidence -> can evaluate
      - explicit non-compliance marker -> FAIL
      - insufficient physical measurement evidence -> NEEDS_REVIEW
      - never automatically PASS merely because OCR found text
    """

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:

        if not declaration:
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    "No declaration evidence is available for legibility/font-height "
                    "assessment. Officer review is required."
                ),
                0.0,
            )

        value = (
            declaration.normalized_value
            or declaration.raw_text
            or ""
        ).strip()

        confidence = float(declaration.confidence or 0.0)

        if not value:
            return (
                ComplianceResult.NEEDS_REVIEW,
                "No readable declaration text is available for font assessment.",
                confidence,
            )

        lowered = value.lower()

        explicit_failure_markers = (
            "below minimum",
            "below statutory minimum",
            "font deficient",
            "font non-compliant",
            "non-compliant font",
            "illegible",
            "not legible",
        )

        if any(marker in lowered for marker in explicit_failure_markers):
            return (
                ComplianceResult.FAIL,
                (
                    "Available evidence indicates that the declaration "
                    "does not satisfy the configured legibility/font requirement."
                ),
                confidence,
            )

        measured_height = parameters.get("measured_height_mm")

        minimum_height = parameters.get("minimum_height_mm")

        if measured_height is not None and minimum_height is not None:
            try:
                measured = float(measured_height)
                minimum = float(minimum_height)

                if measured < minimum:
                    return (
                        ComplianceResult.FAIL,
                        (
                            f"Measured character height ({measured:.2f} mm) "
                            f"is below the configured minimum ({minimum:.2f} mm)."
                        ),
                        confidence,
                    )

                return (
                    ComplianceResult.PASS,
                    (
                        f"Measured character height ({measured:.2f} mm) "
                        f"meets the configured minimum ({minimum:.2f} mm)."
                    ),
                    confidence,
                )

            except (TypeError, ValueError):
                return (
                    ComplianceResult.NEEDS_REVIEW,
                    "Font measurement data is invalid or incomplete.",
                    confidence,
                )

        bounding_box = declaration.bounding_box

        if not bounding_box:
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    "Declaration was detected, but no bounding-box evidence "
                    "is available to support a legibility assessment."
                ),
                confidence,
            )

        required_keys = {"x", "y", "width", "height"}

        if not required_keys.issubset(bounding_box.keys()):
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    "OCR bounding-box evidence is incomplete; physical font "
                    "height cannot be established automatically."
                ),
                confidence,
            )

        return (
            ComplianceResult.NEEDS_REVIEW,
            (
                "OCR bounding-box evidence is available, but physical font "
                "height cannot be established without reliable image/package "
                "scale. Officer verification is required."
            ),
            confidence,
        )


class CustomLogicValidator(BaseValidator):
    """
    Conservative extension point for rule-specific logic.

    The legal rule itself remains in the RuleRepository; this validator
    only interprets explicitly configured parameters.
    """

    @staticmethod
    def validate(
        declaration: Optional[Declaration],
        parameters: Dict[str, Any]
    ) -> Tuple[ComplianceResult, str, float]:

        if not declaration:
            return (
                ComplianceResult.FAIL,
                "Required declaration was not detected for custom validation.",
                0.0,
            )

        value = (
            declaration.normalized_value
            or declaration.raw_text
            or ""
        ).strip()

        confidence = float(declaration.confidence or 0.0)

        if not value:
            return (
                ComplianceResult.FAIL,
                "Declaration is empty and cannot satisfy custom validation.",
                confidence,
            )

        # Optional configured required keywords.
        required_keywords = parameters.get("required_keywords", [])

        if required_keywords:
            lowered = value.lower()

            missing_keywords = [
                keyword
                for keyword in required_keywords
                if str(keyword).lower() not in lowered
            ]

            if missing_keywords:
                return (
                    ComplianceResult.FAIL,
                    (
                        "Required declaration terms are missing: "
                        + ", ".join(map(str, missing_keywords))
                    ),
                    confidence,
                )

        review_threshold = float(
            parameters.get("minimum_confidence_for_automatic_pass", 65.0)
        )

        if confidence < review_threshold:
            return (
                ComplianceResult.NEEDS_REVIEW,
                (
                    f"Declaration detected with OCR confidence "
                    f"{confidence:.1f}%; officer verification is required."
                ),
                confidence,
            )

        return (
            ComplianceResult.PASS,
            "Declaration satisfies the configured custom validation conditions.",
            confidence,
        )


class ValidationEngine:
    """
    Dispatches rule validation to the correct validator.

    The rule repository remains the source of legal requirements.
    This class only maps ValidationType -> validation implementation.
    """

    _VALIDATORS = {
        ValidationType.PRESENCE: PresenceValidator,
        ValidationType.REGEX_MATCH: RegexValidator,
        ValidationType.NUMERIC_RANGE: NumericRangeValidator,
        ValidationType.STANDARD_UNITS: StandardUnitsValidator,
        ValidationType.FONT_HEIGHT: FontSizeValidator,
        ValidationType.DATE_VALIDITY: DateValidityValidator,
        ValidationType.CUSTOM_LOGIC: CustomLogicValidator,
    }

    @classmethod
    def execute_validation(
        cls,
        validation_type: ValidationType,
        declaration: Optional[Declaration],
        parameters: Dict[str, Any],
    ) -> Tuple[ComplianceResult, str, float]:

        validator_cls = cls._VALIDATORS.get(
            validation_type,
            PresenceValidator,
        )

        return validator_cls.validate(
            declaration,
            parameters or {},
        )

