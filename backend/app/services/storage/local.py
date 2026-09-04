import os
import re
import uuid
import aiofiles
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, status
from PIL import Image
import io

from app.core.config import settings
from app.services.storage.base import StorageService, StorageResult


class LocalStorageService(StorageService):
    """Local filesystem storage implementation."""

    ALLOWED_MIME_TYPES = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    }

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.UPLOAD_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        # Strip path traversal and keep safe characters only
        clean_name = Path(filename).name
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
        return clean_name or "file.bin"

    async def save_file(
        self,
        file_content: bytes,
        original_filename: str,
        subfolder: str = "general",
        mime_type: Optional[str] = None
    ) -> StorageResult:
        # 1. Size validation
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        file_size = len(file_content)
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        # 2. Type validation using Pillow for images
        detected_mime = mime_type or "application/octet-stream"
        if detected_mime.startswith("image/"):
            try:
                img = Image.open(io.BytesIO(file_content))
                img.verify()
                # Format to MIME mapping
                format_lower = (img.format or "").lower()
                if format_lower in ["jpeg", "jpg"]:
                    detected_mime = "image/jpeg"
                elif format_lower == "png":
                    detected_mime = "image/png"
                elif format_lower == "webp":
                    detected_mime = "image/webp"
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is not a valid or readable image"
                )

        if detected_mime not in self.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {detected_mime}. Allowed types: {list(self.ALLOWED_MIME_TYPES.keys())}"
            )

        # 3. Path construction
        target_dir = self.base_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        safe_name = self._sanitize_filename(original_filename)
        unique_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
        full_path = target_dir / unique_name

        # 4. Write to disk
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(file_content)

        relative_path = str(full_path.relative_to(self.base_dir)).replace("\\", "/")
        url = self.get_url(relative_path)

        return StorageResult(
            file_path=relative_path,
            file_name=safe_name,
            file_size_bytes=file_size,
            mime_type=detected_mime,
            url=url
        )

    async def get_file(self, file_path: str) -> bytes:
        full_path = (self.base_dir / file_path).resolve()
        if not full_path.is_relative_to(self.base_dir) or not full_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found in storage"
            )
        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()

    async def delete_file(self, file_path: str) -> bool:
        full_path = (self.base_dir / file_path).resolve()
        if full_path.is_relative_to(self.base_dir) and full_path.exists():
            full_path.unlink()
            return True
        return False

    def get_url(self, file_path: str) -> str:
        clean_rel = file_path.replace("\\", "/")
        return f"/uploads/{clean_rel}"
