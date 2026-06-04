import uuid
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()


class StorageService:
    def __init__(self) -> None:
        self.backend = settings.STORAGE_BACKEND.lower()
        self.local_root = Path(settings.LOCAL_STORAGE_PATH)
        if self.backend == "local":
            self.local_root.mkdir(parents=True, exist_ok=True)

    def build_storage_key(self, folder: str, patient_id: int, file_name: str) -> str:
        safe_name = file_name.replace(" ", "_")
        return f"patients/{patient_id}/{folder}/{uuid.uuid4().hex}_{safe_name}"

    def save_file(self, storage_key: str, content: bytes, mime_type: str) -> None:
        if self.backend == "s3":
            self._save_s3(storage_key, content, mime_type)
        else:
            self._save_local(storage_key, content)

    def delete_file(self, storage_key: str) -> None:
        if self.backend == "s3":
            self._delete_s3(storage_key)
        else:
            self._delete_local(storage_key)

    def get_download_url(self, storage_key: str) -> str:
        if self.backend == "s3":
            return self._signed_s3_url(storage_key)
        return f"/api/v1/medical-records/files/{storage_key}"

    def read_file(self, storage_key: str) -> tuple[bytes, str | None]:
        if self.backend == "s3":
            return self._read_s3(storage_key)
        return self._read_local(storage_key), None

    def _save_local(self, storage_key: str, content: bytes) -> None:
        path = self.local_root / storage_key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    def _delete_local(self, storage_key: str) -> None:
        path = self.local_root / storage_key
        if path.exists():
            path.unlink()

    def _read_local(self, storage_key: str) -> bytes:
        path = self.local_root / storage_key
        return path.read_bytes()

    def _s3_client(self):
        return boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
            region_name=settings.AWS_REGION,
        )

    def _save_s3(self, storage_key: str, content: bytes, mime_type: str) -> None:
        client = self._s3_client()
        client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=storage_key,
            Body=content,
            ContentType=mime_type,
        )

    def _delete_s3(self, storage_key: str) -> None:
        client = self._s3_client()
        client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=storage_key)

    def _signed_s3_url(self, storage_key: str) -> str:
        client = self._s3_client()
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": storage_key},
            ExpiresIn=settings.S3_SIGNED_URL_EXPIRE_SECONDS,
        )

    def _read_s3(self, storage_key: str) -> tuple[bytes, str | None]:
        client = self._s3_client()
        try:
            response = client.get_object(Bucket=settings.S3_BUCKET_NAME, Key=storage_key)
            content = response["Body"].read()
            mime_type = response.get("ContentType")
            return content, mime_type
        except ClientError as exc:
            raise FileNotFoundError(storage_key) from exc


storage_service = StorageService()
