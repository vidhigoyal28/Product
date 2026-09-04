import abc
from typing import Optional
from pydantic import BaseModel


class StorageResult(BaseModel):
    file_path: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    url: str


class StorageService(abc.ABC):
    """Abstract Base Class for package image and document storage."""

    @abc.abstractmethod
    async def save_file(
        self,
        file_content: bytes,
        original_filename: str,
        subfolder: str = "general",
        mime_type: Optional[str] = None
    ) -> StorageResult:
        """Save a file to the storage provider and return its metadata."""
        pass

    @abc.abstractmethod
    async def get_file(self, file_path: str) -> bytes:
        """Retrieve binary content of a file."""
        pass

    @abc.abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from the storage provider."""
        pass

    @abc.abstractmethod
    def get_url(self, file_path: str) -> str:
        """Get the accessible URL/URI for a stored file."""
        pass
