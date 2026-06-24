"""
Medical file storage — supports local, Cloudinary (primary), and S3.

Set STORAGE_BACKEND=cloudinary for production PDF/image uploads.
Set STORAGE_DUAL_WRITE_S3=true to mirror uploads to S3 as backup.

storage_key format in DB:
  cloudinary:patients/{id}/{folder}/{uuid}_{file}
  s3:patients/{id}/{folder}/{uuid}_{file}
  patients/...  (legacy local — no prefix)
"""

from __future__ import annotations

import logging
import uuid
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

CLOUDINARY_PREFIX = "cloudinary:"
S3_PREFIX = "s3:"


def _parse_storage_key(storage_key: str) -> tuple[str, str]:
    if storage_key.startswith(CLOUDINARY_PREFIX):
        return "cloudinary", storage_key[len(CLOUDINARY_PREFIX) :]
    if storage_key.startswith(S3_PREFIX):
        return "s3", storage_key[len(S3_PREFIX) :]
    return "local", storage_key


def _format_storage_key(provider: str, logical_key: str) -> str:
    if provider == "cloudinary":
        return f"{CLOUDINARY_PREFIX}{logical_key}"
    if provider == "s3":
        return f"{S3_PREFIX}{logical_key}"
    return logical_key


class StorageService:
    def __init__(self) -> None:
        self.backend = settings.STORAGE_BACKEND.lower()
        self.dual_write_s3 = settings.STORAGE_DUAL_WRITE_S3
        self.local_root = Path(settings.LOCAL_STORAGE_PATH)
        if self.backend == "local":
            self.local_root.mkdir(parents=True, exist_ok=True)
        self._cloudinary_ready = False
        if self.backend == "cloudinary" or self.dual_write_s3:
            self._init_cloudinary()

    def _init_cloudinary(self) -> None:
        if not settings.cloudinary_configured:
            if self.backend == "cloudinary":
                raise RuntimeError(
                    "STORAGE_BACKEND=cloudinary requires CLOUDINARY_CLOUD_NAME, "
                    "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
                )
            return
        import cloudinary

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        self._cloudinary_ready = True

    def build_storage_key(self, folder: str, patient_id: int, file_name: str) -> str:
        safe_name = file_name.replace(" ", "_")
        logical = f"patients/{patient_id}/{folder}/{uuid.uuid4().hex}_{safe_name}"
        if self.backend == "cloudinary" and settings.CLOUDINARY_FOLDER:
            logical = f"{settings.CLOUDINARY_FOLDER}/{logical}"
        return _format_storage_key(self.backend, logical) if self.backend != "local" else logical

    def save_file(self, storage_key: str, content: bytes, mime_type: str) -> None:
        provider, logical_key = _parse_storage_key(storage_key)

        if provider == "cloudinary" or (self.backend == "cloudinary" and provider == "local"):
            key = logical_key if provider != "local" else storage_key
            prefixed = _format_storage_key("cloudinary", key)
            self._save_cloudinary(key, content, mime_type)
            if self.dual_write_s3 and settings.s3_configured:
                try:
                    self._save_s3(key, content, mime_type)
                except Exception as exc:
                    logger.warning("S3 dual-write failed (Cloudinary save succeeded): %s", exc)
            return

        if provider == "s3" or self.backend == "s3":
            key = logical_key if provider != "local" else storage_key
            self._save_s3(key, content, mime_type)
            return

        key = logical_key if provider == "local" else storage_key
        self._save_local(key, content)

    def delete_file(self, storage_key: str) -> None:
        provider, logical_key = _parse_storage_key(storage_key)

        if provider == "cloudinary":
            self._delete_cloudinary(logical_key)
            if self.dual_write_s3 and settings.s3_configured:
                try:
                    self._delete_s3(logical_key)
                except Exception as exc:
                    logger.warning("S3 dual-delete failed: %s", exc)
            return

        if provider == "s3":
            self._delete_s3(logical_key)
            return

        self._delete_local(logical_key)

    def get_download_url(self, storage_key: str) -> str:
        provider, logical_key = _parse_storage_key(storage_key)

        if provider == "cloudinary":
            return self._cloudinary_download_url(logical_key)

        if provider == "s3":
            return self._signed_s3_url(logical_key)

        return f"/api/v1/medical-records/files/{logical_key}"

    def read_file(self, storage_key: str) -> tuple[bytes, str | None]:
        provider, logical_key = _parse_storage_key(storage_key)

        if provider == "cloudinary":
            return self._read_cloudinary(logical_key)

        if provider == "s3":
            return self._read_s3(logical_key)

        # Local key — try disk first, then optional cloud/S3 fallbacks for migrated deploys
        try:
            return self._read_local(logical_key), None
        except FileNotFoundError:
            pass

        if self._cloudinary_ready:
            for candidate in self._cloudinary_key_candidates(logical_key):
                try:
                    return self._read_cloudinary(candidate)
                except FileNotFoundError:
                    continue

        if settings.s3_configured:
            try:
                return self._read_s3(logical_key)
            except FileNotFoundError:
                pass

        raise FileNotFoundError(storage_key)

    # ── Local ──────────────────────────────────────────────────────────────

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
        if not path.exists():
            raise FileNotFoundError(storage_key)
        return path.read_bytes()

    def _cloudinary_key_candidates(self, logical_key: str) -> list[str]:
        candidates = [logical_key]
        folder = settings.CLOUDINARY_FOLDER.strip("/") if settings.CLOUDINARY_FOLDER else ""
        if folder:
            prefixed = f"{folder}/{logical_key}"
            candidates.insert(0, prefixed)
            if logical_key.startswith(f"{folder}/"):
                candidates.append(logical_key[len(folder) + 1 :])
        return list(dict.fromkeys(candidates))

    # ── S3 ─────────────────────────────────────────────────────────────────

    def _s3_client(self):
        return boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
            region_name=settings.AWS_REGION,
        )

    def _save_s3(self, storage_key: str, content: bytes, mime_type: str) -> None:
        if not settings.s3_configured:
            raise RuntimeError("S3 is not configured (S3_BUCKET_NAME required)")
        client = self._s3_client()
        client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=storage_key,
            Body=content,
            ContentType=mime_type,
        )

    def _delete_s3(self, storage_key: str) -> None:
        if not settings.s3_configured:
            return
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

    # ── Cloudinary ─────────────────────────────────────────────────────────

    def _cloudinary_resource_type(self, mime_type: str) -> str:
        if mime_type.startswith("image/"):
            return "image"
        return "raw"

    def _save_cloudinary(self, public_id: str, content: bytes, mime_type: str) -> None:
        if not self._cloudinary_ready:
            raise RuntimeError("Cloudinary is not configured")
        import cloudinary.uploader

        resource_type = self._cloudinary_resource_type(mime_type)
        cloudinary.uploader.upload(
            BytesIO(content),
            public_id=public_id,
            resource_type=resource_type,
            overwrite=True,
            unique_filename=False,
            use_filename=False,
        )

    def _delete_cloudinary(self, public_id: str) -> None:
        if not self._cloudinary_ready:
            return
        import cloudinary.uploader

        for resource_type in ("raw", "image"):
            try:
                cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            except Exception:
                pass

    def _cloudinary_download_url(self, public_id: str) -> str:
        if not self._cloudinary_ready:
            raise RuntimeError("Cloudinary is not configured")
        import cloudinary.utils

        for resource_type in ("raw", "image"):
            url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type=resource_type,
                secure=True,
                sign_url=True,
                type="upload",
            )
            if url:
                return url
        return cloudinary.utils.cloudinary_url(public_id, secure=True, sign_url=True)

    def _read_cloudinary(self, public_id: str) -> tuple[bytes, str | None]:
        url = self._cloudinary_download_url(public_id)
        try:
            with urlopen(url, timeout=60) as response:
                content = response.read()
                mime = response.headers.get_content_type()
                return content, mime
        except (HTTPError, URLError) as exc:
            raise FileNotFoundError(public_id) from exc


storage_service = StorageService()
