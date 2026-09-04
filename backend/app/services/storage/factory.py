from app.core.config import settings
from app.services.storage.base import StorageService
from app.services.storage.local import LocalStorageService

_storage_instance: StorageService = None


def get_storage_service() -> StorageService:
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_DRIVER == "local":
            _storage_instance = LocalStorageService(settings.UPLOAD_DIR)
        else:
            # Extensible for S3 / Cloud drivers
            _storage_instance = LocalStorageService(settings.UPLOAD_DIR)
    return _storage_instance
