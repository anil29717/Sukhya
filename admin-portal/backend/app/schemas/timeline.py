from datetime import date, datetime

from pydantic import BaseModel, Field


class TimelineEventResponse(BaseModel):
    event_type: str
    reference_id: int
    title: str
    summary: str | None
    event_at: datetime
    patient_id: int
    extra: dict | None = None


class TimelineListResponse(BaseModel):
    items: list[TimelineEventResponse]
    total: int
    page: int
    page_size: int


class DownloadLogResponse(BaseModel):
    id: int
    medical_record_id: int
    record_title: str
    record_type: str
    downloaded_at: datetime
    downloaded_by: str | None = None


class AccessLogResponse(BaseModel):
    id: int
    action: str
    resource: str | None
    details: str | None
    user_id: int | None
    ip_address: str | None
    created_at: datetime


class DigitalLockerSummaryResponse(BaseModel):
    patient_id: int
    total_records: int
    by_type: dict[str, int]
    total_downloads: int
    total_access_events: int
    shared_with_family: bool = False


class DigitalLockerListResponse(BaseModel):
    summary: DigitalLockerSummaryResponse
    recent_downloads: list[DownloadLogResponse]
    recent_access: list[AccessLogResponse]
