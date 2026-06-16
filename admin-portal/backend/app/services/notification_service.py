import json
import logging
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Notification, NotificationChannel, NotificationStatus, User

logger = logging.getLogger(__name__)
settings = get_settings()


class NotificationService:
    def send(
        self,
        db: Session,
        *,
        user: User,
        channel: str,
        event_type: str,
        title: str,
        message: str,
        metadata: dict | None = None,
    ) -> Notification:
        notification = Notification(
            user_id=user.id,
            channel=channel,
            event_type=event_type,
            title=title,
            message=message,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
        db.add(notification)
        db.flush()

        if not settings.NOTIFICATIONS_ENABLED:
            notification.status = NotificationStatus.SENT.value
            notification.sent_at = datetime.now(UTC)
            db.commit()
            db.refresh(notification)
            return notification

        try:
            if channel == NotificationChannel.EMAIL.value:
                self._send_email(user.email, title, message)
            elif channel == NotificationChannel.WHATSAPP.value:
                self._send_whatsapp(user.phone, message)
            notification.status = NotificationStatus.SENT.value
            notification.sent_at = datetime.now(UTC)
        except Exception as exc:  # noqa: BLE001
            notification.status = NotificationStatus.FAILED.value
            notification.error_message = str(exc)
            logger.exception("Notification delivery failed")

        db.commit()
        db.refresh(notification)
        return notification

    def _send_email(self, to_email: str, subject: str, body: str) -> None:
        if not settings.SMTP_HOST:
            logger.info("[DEV EMAIL] To=%s Subject=%s Body=%s", to_email, subject, body)
            return

        import smtplib
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

    def _send_whatsapp(self, phone: str | None, message: str) -> None:
        if not phone:
            raise ValueError("User has no phone number for WhatsApp")

        if not settings.WHATSAPP_API_URL:
            logger.info("[DEV WHATSAPP] Phone=%s Message=%s", phone, message)
            return

        import urllib.request

        payload = json.dumps({"phone": phone, "message": message}).encode()
        request = urllib.request.Request(
            settings.WHATSAPP_API_URL,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
            },
            method="POST",
        )
        urllib.request.urlopen(request, timeout=10)


notification_service = NotificationService()


def notify_appointment_booked(db: Session, patient_user: User, doctor_name: str, appt_date: str, appt_time: str) -> None:
    notification_service.send(
        db,
        user=patient_user,
        channel=NotificationChannel.EMAIL.value,
        event_type="appointment_confirmation",
        title="Appointment Booked",
        message=f"Your appointment with Dr. {doctor_name} on {appt_date} at {appt_time} has been booked.",
        metadata={"doctor_name": doctor_name, "date": appt_date, "time": appt_time},
    )


def notify_appointment_confirmed(db: Session, patient_user: User, doctor_name: str, appt_date: str, appt_time: str) -> None:
    notification_service.send(
        db,
        user=patient_user,
        channel=NotificationChannel.EMAIL.value,
        event_type="appointment_confirmation",
        title="Appointment Confirmed",
        message=f"Your appointment with Dr. {doctor_name} on {appt_date} at {appt_time} is confirmed.",
    )
    notification_service.send(
        db,
        user=patient_user,
        channel=NotificationChannel.WHATSAPP.value,
        event_type="appointment_status_update",
        title="Appointment Confirmed",
        message=f"Confirmed: Dr. {doctor_name} on {appt_date} at {appt_time}.",
    )


def notify_appointment_status(db: Session, user: User, status: str, details: str) -> None:
    notification_service.send(
        db,
        user=user,
        channel=NotificationChannel.WHATSAPP.value,
        event_type="appointment_status_update",
        title=f"Appointment {status.title()}",
        message=details,
    )


def notify_prescription_shared(db: Session, patient_user: User, doctor_name: str) -> None:
    notification_service.send(
        db,
        user=patient_user,
        channel=NotificationChannel.EMAIL.value,
        event_type="prescription_shared",
        title="New Prescription Available",
        message=f"Dr. {doctor_name} has shared a new prescription with you.",
    )


def notify_report_uploaded(db: Session, patient_user: User, record_title: str) -> None:
    notification_service.send(
        db,
        user=patient_user,
        channel=NotificationChannel.EMAIL.value,
        event_type="report_uploaded",
        title="Medical Report Uploaded",
        message=f"A new medical report '{record_title}' has been uploaded to your records.",
    )
