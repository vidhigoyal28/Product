import enum


class UserRole(str, enum.Enum):
    INSPECTOR = "INSPECTOR"
    REVIEWER = "REVIEWER"
    ADMIN = "ADMIN"


class InspectionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_REVIEW = "PENDING_REVIEW"
    COMPLETED = "COMPLETED"
    FLAGGED = "FLAGGED"
    ARCHIVED = "ARCHIVED"


class ComplianceResult(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class OverallStatus(str, enum.Enum):
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class ImageType(str, enum.Enum):
    PDP = "PDP"             # Principal Display Panel / Front
    BACK = "BACK"           # Back Panel / Ingredients / Address
    ADDITIONAL = "ADDITIONAL" # Close-up / Nutrition / Side


class ImageQualityStatus(str, enum.Enum):
    GOOD = "GOOD"
    ACCEPTABLE = "ACCEPTABLE"
    BLURRY = "BLURRY"
    GLARE = "GLARE"
    LOW_RESOLUTION = "LOW_RESOLUTION"
    UNASSESSED = "UNASSESSED"


class DeclarationStatus(str, enum.Enum):
    DETECTED = "DETECTED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    EDITED = "EDITED"


class ValidationType(str, enum.Enum):
    PRESENCE = "PRESENCE"
    REGEX_MATCH = "REGEX_MATCH"
    NUMERIC_RANGE = "NUMERIC_RANGE"
    STANDARD_UNITS = "STANDARD_UNITS"
    FONT_HEIGHT = "FONT_HEIGHT"
    DATE_VALIDITY = "DATE_VALIDITY"
    CUSTOM_LOGIC = "CUSTOM_LOGIC"


class RuleSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ReviewActionType(str, enum.Enum):
    ACCEPT_ALL = "ACCEPT_ALL"
    EDIT_DECLARATION = "EDIT_DECLARATION"
    REJECT_DECLARATION = "REJECT_DECLARATION"
    OVERRIDE_VERDICT = "OVERRIDE_VERDICT"
    SIGN_OFF = "SIGN_OFF"


class ReportType(str, enum.Enum):
    FORM_II_STATUTORY_NOTICE = "FORM_II_STATUTORY_NOTICE"
    COMPLIANCE_CERTIFICATE = "COMPLIANCE_CERTIFICATE"
    VIOLATION_DOSSIER = "VIOLATION_DOSSIER"
