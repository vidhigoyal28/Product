import abc
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.models.enums import ImageQualityStatus, ImageType


# -----------------------------------------------------------------------------
# Data transfer objects for AI pipelines
# -----------------------------------------------------------------------------

class QualityMetrics(BaseModel):
    sharpness: float = Field(..., description="Estimated Laplacian variance / sharpness score (0-100)")
    glare_detected: bool = Field(False, description="Whether bright glare / reflection obscures text")
    skew_angle_deg: float = Field(0.0, description="Estimated skew angle in degrees")
    resolution: str = Field("1920x1080", description="Image resolution (WxH)")
    quality_status: ImageQualityStatus = ImageQualityStatus.GOOD
    remarks: Optional[str] = None


class PreprocessingResult(BaseModel):
    is_deskewed: bool = True
    contrast_enhanced: bool = True
    pdp_cropped: bool = False
    processed_image_bytes: Optional[bytes] = None
    applied_filters: List[str] = []


class OCRWordToken(BaseModel):
    text: str
    confidence: float
    bounding_box: Dict[str, Any] # { "x": float, "y": float, "width": float, "height": float, "unit": "percent" }


class OCRResult(BaseModel):
    raw_full_text: str
    tokens: List[OCRWordToken] = []
    average_confidence: float = 0.0


class DetectedRegion(BaseModel):
    region_id: str
    region_type: str # "PDP", "MRP_BLOCK", "NET_QTY_BLOCK", "MANUFACTURER_BLOCK", "CONSUMER_CARE_BLOCK", "BARCODE_QR"
    bounding_box: Dict[str, Any]
    confidence: float
    detected_text: Optional[str] = None


class ExtractedDeclarationDTO(BaseModel):
    field_name: str # e.g. "commodity_name", "net_quantity", "mrp", "unit_sale_price", "manufacturer_details", etc.
    raw_text: str
    normalized_value: str
    confidence: float
    bounding_box: Dict[str, Any]
    source_image_id: Optional[str] = None


# -----------------------------------------------------------------------------
# Clean Service Interfaces
# -----------------------------------------------------------------------------

class IImageQualityAnalyzer(abc.ABC):
    """Interface for assessing label image quality (sharpness, glare, skew)."""
    @abc.abstractmethod
    async def assess_quality(self, image_bytes: bytes, image_name: str) -> QualityMetrics:
        pass


class IImagePreprocessor(abc.ABC):
    """Interface for deskewing, noise reduction, and PDP panel normalization."""
    @abc.abstractmethod
    async def preprocess(self, image_bytes: bytes, image_type: ImageType) -> PreprocessingResult:
        pass


class IOCRService(abc.ABC):
    """Interface for Optical Character Recognition text & token extraction."""
    @abc.abstractmethod
    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        pass


class IRegionDetector(abc.ABC):
    """Interface for text block localization and bounding box detection."""
    @abc.abstractmethod
    async def detect_regions(self, image_bytes: bytes) -> List[DetectedRegion]:
        pass


class IDeclarationExtractor(abc.ABC):
    """Interface for structured entity parsing from OCR and localized regions."""
    @abc.abstractmethod
    async def extract_declarations(
        self,
        ocr_result: OCRResult,
        detected_regions: List[DetectedRegion],
        product_category: Optional[str] = None
    ) -> List[ExtractedDeclarationDTO]:
        pass
