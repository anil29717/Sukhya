from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Healthcare Platform API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql://healthcare:healthcare_secret@localhost:5432/healthcare_db"

    SECRET_KEY: str = "change-this-to-a-long-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DEFAULT_ADMIN_EMAIL: str = "admin@example.com"
    DEFAULT_ADMIN_PASSWORD: str = "Admin@123456"
    DEFAULT_ADMIN_FULL_NAME: str = "System Administrator"

    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    # Storage — cloudinary (primary for medical PDFs), s3, or local
    STORAGE_BACKEND: str = "local"  # local | cloudinary | s3
    STORAGE_DUAL_WRITE_S3: bool = False  # mirror Cloudinary uploads to S3 backup
    LOCAL_STORAGE_PATH: str = "./storage"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = ""
    S3_SIGNED_URL_EXPIRE_SECONDS: int = 3600
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "lumina-health"  # optional root folder prefix in Cloudinary
    MAX_UPLOAD_SIZE_MB: int = 10

    @property
    def s3_configured(self) -> bool:
        return bool(self.S3_BUCKET_NAME and self.AWS_ACCESS_KEY_ID and self.AWS_SECRET_ACCESS_KEY)

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET
        )

    # Notifications
    NOTIFICATIONS_ENABLED: bool = True
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@example.com"
    SMTP_USE_TLS: bool = True
    WHATSAPP_API_URL: str = ""
    WHATSAPP_API_TOKEN: str = ""

    SEED_DEMO_DATA: bool = True
    ADMIN_DB_COPY_ENABLED: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
