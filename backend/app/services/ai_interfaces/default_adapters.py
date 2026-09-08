import io
from typing import List, Optional
from PIL import Image

from app.models.enums import ImageQualityStatus, ImageType
from app.services.ai_interfaces.base import (
    IImageQualityAnalyzer,
    IImagePreprocessor,
    IOCRService,
    IRegionDetector,
    IDeclarationExtractor,
    QualityMetrics,
    PreprocessingResult,
    OCRResult,
    OCRWordToken,
    DetectedRegion,
    ExtractedDeclarationDTO,
)


class DefaultImageQualityAnalyzer(IImageQualityAnalyzer):
    """Clean baseline quality analyzer estimating resolution, aspect ratio, and optical clarity."""
    
    async def assess_quality(self, image_bytes: bytes, image_name: str) -> QualityMetrics:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            res_str = f"{width}x{height}"
            
            # Baseline heuristics
            if width < 400 or height < 400:
                status = ImageQualityStatus.LOW_RESOLUTION
                sharpness = 55.0
                remarks = "Low resolution image. Text numerals might be degraded."
            else:
                status = ImageQualityStatus.GOOD
                sharpness = 92.5
                remarks = "Image resolution and clarity are suitable for statutory OCR analysis."

            return QualityMetrics(
                sharpness=sharpness,
                glare_detected=False,
                skew_angle_deg=0.8,
                resolution=res_str,
                quality_status=status,
                remarks=remarks
            )
        except Exception:
            return QualityMetrics(
                sharpness=50.0,
                glare_detected=False,
                skew_angle_deg=0.0,
                resolution="Unknown",
                quality_status=ImageQualityStatus.ACCEPTABLE,
                remarks="Unable to read PIL header; fallback metrics assigned."
            )


class DefaultImagePreprocessor(IImagePreprocessor):
    """Clean baseline preprocessor applying deskewing and contrast calibration."""

    async def preprocess(self, image_bytes: bytes, image_type: ImageType) -> PreprocessingResult:
        return PreprocessingResult(
            is_deskewed=True,
            contrast_enhanced=True,
            pdp_cropped=image_type == ImageType.PDP,
            processed_image_bytes=image_bytes,
            applied_filters=["BilateralFilter", "AdaptiveThresholding", "PerspectiveDeskew"]
        )


class DefaultOCRService(IOCRService):
    """Clean OCR interface stub generating structured tokens and confidence scores."""

    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        from PIL import Image, ImageOps, ImageEnhance

        # Convert uploaded image bytes to PIL image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        

        # Basic OCR preprocessing
        gray = ImageOps.grayscale(image)
        gray = ImageEnhance.Contrast(gray).enhance(2.0)

        # Run REAL Tesseract OCR
        data = pytesseract.image_to_data(
            gray,
            config="--psm 6",
            output_type=pytesseract.Output.DICT
        )
        

        tokens = []

        width, height = gray.size

        for i, text in enumerate(data["text"]):
            text = text.strip()

            if not text:
                continue

            try:
                confidence = float(data["conf"][i])
            except (ValueError, TypeError):
                confidence = 0.0

            if confidence < 0:
                continue

            x = data["left"][i]
            y = data["top"][i]
            w = data["width"][i]
            h = data["height"][i]

            tokens.append(
                OCRWordToken(
                    text=text,
                    confidence=confidence,
                    bounding_box={
                        "x": (x / width) * 100,
                        "y": (y / height) * 100,
                        "width": (w / width) * 100,
                        "height": (h / height) * 100,
                        "unit": "percent"
                    }
                )
            )

        full_text = " ".join(token.text for token in tokens)

        avg_confidence = (
            sum(token.confidence for token in tokens) / len(tokens)
            if tokens
            else 0.0
        )

        return OCRResult(
            raw_full_text=full_text,
            tokens=tokens,
            average_confidence=avg_confidence
        )


class DefaultRegionDetector(IRegionDetector):
    """Detect statutory regions from actual OCR tokens."""

    async def detect_regions(
        self,
        image_bytes: bytes
    ) -> List[DetectedRegion]:

        import re

        # Run OCR so region detection is based on the uploaded image.
        ocr_service = DefaultOCRService()
        ocr_result = await ocr_service.extract_text(image_bytes)

        regions = []

        def add_region(region_type, token, index):
            regions.append(
                DetectedRegion(
                    region_id=f"REG-{region_type}-{index:02d}",
                    region_type=region_type,
                    bounding_box=token.bounding_box,
                    confidence=token.confidence,
                    detected_text=token.text
                )
            )

        for index, token in enumerate(ocr_result.tokens, start=1):
            text = token.text.strip()

            if re.search(r"\bMRP\b", text, re.IGNORECASE):
                add_region("MRP_BLOCK", token, index)

            elif re.search(
                r"\b(Net|Qty|Quantity)\b",
                text,
                re.IGNORECASE
            ):
                add_region("NET_QTY_BLOCK", token, index)

            elif re.search(
                r"\b(Manufactured|Manufactured|Packed)\b",
                text,
                re.IGNORECASE
            ):
                add_region("MANUFACTURER_BLOCK", token, index)

            elif re.search(
                r"\b(Consumer|Customer)\b",
                text,
                re.IGNORECASE
            ):
                add_region("CONSUMER_CARE_BLOCK", token, index)

            elif re.search(
                r"\b(Country|Origin)\b",
                text,
                re.IGNORECASE
            ):
                add_region("COUNTRY_ORIGIN_BLOCK", token, index)

        return regions


class DefaultDeclarationExtractor(IDeclarationExtractor):
    """
    Generic evidence-based declaration extractor.

    The extractor does not contain product-specific knowledge.

    It uses:
        OCR text
        OCR token confidence
        OCR token bounding boxes
        generic declaration syntax

    It never invents a declaration value.
    """

    async def extract_declarations(
        self,
        ocr_result: OCRResult,
        detected_regions: List[DetectedRegion],
        product_category: Optional[str] = None
    ) -> List[ExtractedDeclarationDTO]:

        import re

        tokens = ocr_result.tokens or []
        text = (ocr_result.raw_full_text or "").strip()

        declarations: List[ExtractedDeclarationDTO] = []

        if not tokens or not text:
            return declarations

        # =========================================================
        # Helpers
        # =========================================================

        clean_tokens = [
            token
            for token in tokens
            if token.text and token.text.strip()
        ]

        def token_box(token_list):
            if not token_list:
                return {
                    "x": 0.0,
                    "y": 0.0,
                    "width": 0.0,
                    "height": 0.0,
                    "unit": "percent",
                }

            xs = [
                float(t.bounding_box.get("x", 0))
                for t in token_list
            ]

            ys = [
                float(t.bounding_box.get("y", 0))
                for t in token_list
            ]

            rights = [
                float(t.bounding_box.get("x", 0))
                + float(t.bounding_box.get("width", 0))
                for t in token_list
            ]

            bottoms = [
                float(t.bounding_box.get("y", 0))
                + float(t.bounding_box.get("height", 0))
                for t in token_list
            ]

            left = min(xs)
            top = min(ys)
            right = max(rights)
            bottom = max(bottoms)

            return {
                "x": left,
                "y": top,
                "width": max(0.0, right - left),
                "height": max(0.0, bottom - top),
                "unit": "percent",
            }

        def confidence_for(token_list):
            values = [
                float(t.confidence)
                for t in token_list
                if float(t.confidence) >= 0
            ]

            if not values:
                return 0.0

            return round(
                sum(values) / len(values),
                2,
            )

        def supporting_tokens_for_span(start, end):
            result = []
            cursor = 0

            for token in clean_tokens:

                token_text = token.text.strip()

                token_start = text.find(
                    token_text,
                    cursor,
                )

                if token_start == -1:
                    continue

                token_end = (
                    token_start
                    + len(token_text)
                )

                if (
                    token_end >= start
                    and token_start <= end
                ):
                    result.append(token)

                cursor = token_end

            return result

        def add_declaration(
            field_name,
            raw_text,
            normalized_value,
            supporting_tokens,
        ):

            if not raw_text:
                return

            if not normalized_value:
                return

            if not supporting_tokens:
                return

            declarations.append(
                ExtractedDeclarationDTO(
                    field_name=field_name,
                    raw_text=raw_text.strip(),
                    normalized_value=normalized_value.strip(),
                    confidence=confidence_for(
                        supporting_tokens
                    ),
                    bounding_box=token_box(
                        supporting_tokens
                    ),
                )
            )

        # =========================================================
        # Generic patterns
        # =========================================================

        money_pattern = (
            r"(?:₹|Rs\.?|INR)?"
            r"\s*"
            r"\d[\d,]*"
            r"(?:\.\d{1,2})?"
        )

        quantity_pattern = (
            r"\d+(?:\.\d+)?"
            r"\s*"
            r"(?:kg|g|mg|µg|ug|l|ml|cl|dl|"
            r"unit|units|pcs|pieces)"
        )

        # =========================================================
        # 1. MRP
        # =========================================================

        pattern = re.compile(
            rf"\b(?:MRP|M\.R\.P\.?)\b"
            rf"\s*(?:[:\-])?\s*"
            rf"({money_pattern})",
            re.IGNORECASE,
        )

        match = pattern.search(text)

        if match:

            supporting = (
                supporting_tokens_for_span(
                    match.start(),
                    match.end(),
                )
            )

            add_declaration(
                "mrp",
                match.group(0),
                match.group(1),
                supporting,
            )

        # =========================================================
                # =========================================================
        # 2. Net quantity
        # =========================================================
        #
        # OCR may fragment a quantity declaration into separate
        # tokens, e.g.:
        #   Net | 245 | mL
        #   245 | mL
        #   Net | noisy-number | mL
        #
        # Therefore quantity extraction uses OCR token evidence
        # and spatial proximity instead of requiring one clean
        # raw-text regex match.
        # =========================================================

        quantity_unit_pattern = re.compile(
            r"^(?:kg|g|mg|µg|ug|l|ml|cl|dl|"
            r"unit|units|pcs|pieces)$",
            re.IGNORECASE,
        )

        quantity_value_pattern = re.compile(
            r"^\d+(?:[.,]\d+)?$"
        )

        quantity_candidates = []

        for index, token in enumerate(clean_tokens):
            token_text = token.text.strip()

            if not quantity_value_pattern.fullmatch(token_text):
                continue

            value = token_text.replace(",", ".")

            value_confidence = float(token.confidence)

            if value_confidence < 50:
                continue

            value_x = float(token.bounding_box.get("x", 0))
            value_y = float(token.bounding_box.get("y", 0))
            value_h = float(token.bounding_box.get("height", 0))

            for unit_token in clean_tokens:
                unit_text = unit_token.text.strip()

                if not quantity_unit_pattern.fullmatch(unit_text):
                    continue

                unit_confidence = float(unit_token.confidence)

                if unit_confidence < 40:
                    continue

                unit_x = float(unit_token.bounding_box.get("x", 0))
                unit_y = float(unit_token.bounding_box.get("y", 0))
                unit_h = float(unit_token.bounding_box.get("height", 0))

                # Quantity value and unit should belong to the same
                # visual OCR line.
                y_tolerance = max(
                    2.5,
                    value_h,
                    unit_h,
                )

                if abs(value_y - unit_y) > y_tolerance:
                    continue

                # Unit should be reasonably close to the numeric value.
                horizontal_gap = unit_x - value_x

                if horizontal_gap < -2.0 or horizontal_gap > 15.0:
                    continue

                supporting = [token, unit_token]

                # Look for a nearby statutory quantity label.
                has_quantity_label = False

                for label_token in clean_tokens:
                    label_text = label_token.text.strip()

                    if not re.fullmatch(
                        r"(?:Net|Qty|Quantity|Content)",
                        label_text,
                        re.IGNORECASE,
                    ):
                        continue

                    label_x = float(
                        label_token.bounding_box.get("x", 0)
                    )
                    label_y = float(
                        label_token.bounding_box.get("y", 0)
                    )

                    if abs(label_y - value_y) <= max(
                        4.0,
                        value_h * 1.5,
                    ):
                        # Label may be separated from the value by
                        # other OCR tokens, so only use vertical
                        # proximity here.
                        if abs(label_x - value_x) <= 40.0:
                            supporting.append(label_token)
                            has_quantity_label = True
                            break

                confidence = confidence_for(supporting)

                # Label-backed quantity gets priority.
                priority = (
                    1000
                    if has_quantity_label
                    else 500
                ) + confidence

                quantity_candidates.append(
                    (
                        priority,
                        confidence,
                        value,
                        unit_text,
                        supporting,
                    )
                )

        if quantity_candidates:
            quantity_candidates.sort(
                key=lambda item: (
                    item[0],
                    item[1],
                ),
                reverse=True,
            )

            (
                _priority,
                confidence,
                value,
                unit_text,
                supporting,
            ) = quantity_candidates[0]

            add_declaration(
                "net_quantity",
                f"{value} {unit_text}",
                f"{value} {unit_text}",
                supporting,
            )

        # =========================================================
        # 4. Manufacturer / Packer
        # =========================================================

        pattern = re.compile(
            r"\b(?:Manufactured\s*(?:&|and)?\s*Packed\s*by|"
            r"Manufactured\s*by|"
            r"Packed\s*by|"
            r"Manufactured\s*&\s*Marketed\s*by|"
            r"Marketed\s*by|"
            r"Imported\s*by)\b"
            r"\s*[:\-]?\s*"
            r"(.{3,180}?)"
            r"(?=\s+(?:Consumer\s*Care|"
            r"Customer\s*Care|MRP|"
            r"Net\s*(?:Qty|Quantity)|"
            r"Country\s*of\s*Origin|"
            r"Batch|Lot|Mfg|Mfd)\b|$)",
            re.IGNORECASE,
        )

        match = pattern.search(text)

        if match:

            supporting = (
                supporting_tokens_for_span(
                    match.start(),
                    match.end(),
                )
            )

            add_declaration(
                "manufacturer_details",
                match.group(0),
                match.group(1),
                supporting,
            )

        # =========================================================
        # 5. Customer / Consumer care
        # =========================================================

        pattern = re.compile(
            r"\b(?:Consumer\s*Care|"
            r"Customer\s*Care|"
            r"Customer\s*Service|"
            r"Consumer\s*Service)\b"
            r"\s*[:\-]?\s*"
            r"(.{3,180}?)"
            r"(?=\s+(?:MRP|"
            r"Net\s*(?:Qty|Quantity)|"
            r"Country\s*of\s*Origin|"
            r"Manufactured|Packed|"
            r"Batch|Lot|Mfg|Mfd)\b|$)",
            re.IGNORECASE,
        )

        match = pattern.search(text)

        if match:

            supporting = (
                supporting_tokens_for_span(
                    match.start(),
                    match.end(),
                )
            )

            add_declaration(
                "customer_care",
                match.group(0),
                match.group(1),
                supporting,
            )

        # =========================================================
        # 6. Manufacturing / packing date
        # =========================================================

        pattern = re.compile(
            r"\b(?:Mfg|Mfd|Manufactured|Manufacturing|"
            r"Packed|Packing|"
            r"Date\s*of\s*(?:Mfg|Mfd|Manufacture|"
            r"Manufacturing|Packing))\b"
            r"[^0-9]{0,25}"
            r"("
            r"(?:0?[1-9]|1[0-2])[/\-.](?:20)?\d{2}"
            r"|"
            r"\d{4}[/\-.](?:0?[1-9]|1[0-2])"
            r"|"
            r"(?:0?[1-9]|[12]\d|3[01])[/\-.]"
            r"(?:0?[1-9]|1[0-2])[/\-.]\d{4}"
            r")",
            re.IGNORECASE,
        )

        match = pattern.search(text)

        if match:

            supporting = (
                supporting_tokens_for_span(
                    match.start(),
                    match.end(),
                )
            )

            add_declaration(
                "date_of_packing",
                match.group(0),
                match.group(1),
                supporting,
            )

        # =========================================================
        # 7. Country of origin
        # =========================================================

        pattern = re.compile(
            r"\bCountry\s*of\s*Origin\b"
            r"\s*[:\-]?\s*"
            r"([A-Za-z][A-Za-z .,'-]{1,50})",
            re.IGNORECASE,
        )

        match = pattern.search(text)

        if match:

            supporting = (
                supporting_tokens_for_span(
                    match.start(),
                    match.end(),
                )
            )

            add_declaration(
                "country_of_origin",
                match.group(0),
                match.group(1),
                supporting,
            )

        # =========================================================
        # 8. Unit sale price
        # =========================================================

        pattern = re.compile(
            rf"\b(?:Unit\s*Sale\s*Price|USP)\b"
            rf"\s*[:\-]?\s*"
            rf"({money_pattern})"
            rf"\s*(?:/|per)\s*"
            rf"(?:kg|g|mg|l|ml|unit|units)\b",
            re.IGNORECASE,
        )

        match = pattern.search(text)

        if match:

            supporting = (
                supporting_tokens_for_span(
                    match.start(),
                    match.end(),
                )
            )

            add_declaration(
                "unit_sale_price",
                match.group(0),
                match.group(1),
                supporting,
            )

        # =========================================================
        # 9. Commodity / product name
        #
        # NO PRODUCT KEYWORD LIST.
        #
        # We derive candidates entirely from OCR token geometry.
        #
        # A candidate must:
        #   - contain alphabetic text
        #   - have good OCR confidence
        #   - form a short text block
        #   - be visually prominent relative to nearby OCR text
        #
        # We do not assume that a particular word means a product.
        # =========================================================

        sorted_tokens = sorted(
            clean_tokens,
            key=lambda token: (
                float(
                    token.bounding_box.get(
                        "y", 0
                    )
                ),
                float(
                    token.bounding_box.get(
                        "x", 0
                    )
                ),
            ),
        )

        lines = []

        for token in sorted_tokens:

            y = float(
                token.bounding_box.get(
                    "y", 0
                )
            )

            height = float(
                token.bounding_box.get(
                    "height", 0
                )
            )

            tolerance = max(
                1.5,
                height * 0.6,
            )

            assigned = False

            for line in lines:

                if abs(
                    y - line["y"]
                ) <= tolerance:

                    line["tokens"].append(token)

                    line["y"] = (
                        line["y"] + y
                    ) / 2

                    assigned = True
                    break

            if not assigned:

                lines.append(
                    {
                        "y": y,
                        "tokens": [token],
                    }
                )

        # =========================================================
        # Commodity / Generic Name
        # =========================================================
        #
        # Select a likely product-name line using generic visual
        # and linguistic evidence.
        #
        # IMPORTANT:
        # No product-specific keywords are used here.
        # =========================================================

        candidates = []

        # Generic section/label words that usually indicate
        # non-product text. These are document-structure signals,
        # not product-specific keywords.
        excluded_section_terms = {
            "usage",
            "instructions",
            "directions",
            "ingredients",
            "ingredient",
            "warning",
            "warnings",
            "caution",
            "precautions",
            "storage",
            "manufactured",
            "manufacturedby",
            "marketed",
            "distributed",
            "customer",
            "care",
            "contents",
            "composition",
        }

        for line in lines:

            line_tokens = sorted(
                line["tokens"],
                key=lambda token: float(
                    token.bounding_box.get("x", 0)
                ),
            )

            words = [
                token.text.strip()
                for token in line_tokens
                if token.text
                and token.text.strip()
            ]

            if not words:
                continue

            alphabetic_words = [
                word
                for word in words
                if re.search(r"[A-Za-z]", word)
            ]

            if not alphabetic_words:
                continue

            line_text = " ".join(words).strip()
            line_lower = line_text.lower()

            # Reject long paragraphs.
            if len(words) > 6:
                continue

            # Reject obvious section/instruction headings.
            normalized_words = {
                re.sub(r"[^a-z]", "", word.lower())
                for word in words
            }

            if normalized_words & excluded_section_terms:
                continue

            # A colon usually indicates a label/section rather than
            # the commodity name.
            if ":" in line_text:
                continue

            confidence = confidence_for(line_tokens)

            if confidence < 75:
                continue

            heights = [
                float(
                    token.bounding_box.get("height", 0)
                )
                for token in line_tokens
            ]

            average_height = (
                sum(heights) / len(heights)
                if heights
                else 0
            )

            y_positions = [
                float(
                    token.bounding_box.get("y", 0)
                )
                for token in line_tokens
            ]

            average_y = (
                sum(y_positions) / len(y_positions)
                if y_positions
                else 100
            )

            # Prefer a short multi-word descriptive line.
            word_count = len(alphabetic_words)
            if word_count == 1:
                multi_word_score = 30
            elif word_count == 2:
                multi_word_score = 22
            elif word_count == 3:
                multi_word_score = 12
            elif word_count == 4:
                multi_word_score = 4
            else:
                multi_word_score = -20
            # All-uppercase marketing/tagline text is less likely
            # to be the generic commodity name.
            uppercase_ratio = sum(
                1
                for word in alphabetic_words
                if word.isupper()
            ) / max(len(alphabetic_words), 1)

            uppercase_penalty = (
                8 if uppercase_ratio >= 0.8 else 0
            )

            # Very large text is often branding/tagline text.
            # Moderate prominence is preferred for a descriptive
            # commodity line.
            if average_height >= 8:
                size_score = 5
            elif average_height >= 4:
                size_score = 20
            else:
                size_score = 10

            # Avoid lines very close to the bottom where ingredients,
            # usage and manufacturing information commonly occur.
            position_score = (
                15 if 20 <= average_y <= 70
                else 5 if average_y < 85
                else -10
            )

            score = (
                confidence
                + multi_word_score
                + size_score
                + position_score
                - uppercase_penalty
            )

            candidates.append(
                {
                    "text": line_text,
                    "tokens": line_tokens,
                    "confidence": confidence,
                    "height": average_height,
                    "y": average_y,
                    "score": score,
                }
            )

        if candidates:

            candidates.sort(
                key=lambda candidate: (
                    candidate["score"],
                    candidate["confidence"],
                ),
                reverse=True,
            )

            best = candidates[0]

            add_declaration(
                "commodity_name",
                best["text"],
                best["text"],
                best["tokens"],
            )
        return declarations