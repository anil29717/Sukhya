"""
Idempotent demo seed for the Lumina Health patient mobile app.

Creates patient@example.com with full profile data plus doctors, appointments,
records, prescriptions, medications, vitals, family, notifications, and timeline.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.storage import storage_service
from app.models import (
    Appointment,
    AppointmentStatus,
    AppointmentWaitlist,
    Doctor,
    DoctorAvailability,
    EmergencyProfile,
    FamilyMember,
    FamilyRelationship,
    MedicalRecord,
    Medication,
    MedicationLog,
    MedicationSchedule,
    Notification,
    NotificationChannel,
    NotificationStatus,
    Patient,
    Prescription,
    PrescriptionStatus,
    RECORD_TYPE_FOLDERS,
    RecordType,
    Role,
    RoleName,
    User,
    VitalSign,
    WaitlistStatus,
    generate_medical_id,
)
from app.models.medication import MedicationLogStatus, VitalType
from app.schemas.auth import UserRegisterRequest
from app.services import auth_service, patient_service, timeline_service

settings = get_settings()
logger = logging.getLogger(__name__)

DEMO_PATIENT_EMAIL = "patient@example.com"
DEMO_PATIENT_PASSWORD = "Password123"
DEMO_MARKER_PHONE = "+1-555-0142"

DOCTORS = [
    {
        "email": "doctor@example.com",
        "password": "Password123",
        "full_name": "Dr. Sarah Chen",
        "phone": "+1-555-0201",
        "specialization": "Cardiology",
        "qualification": "MD, FACC — Stanford Medicine",
        "experience_years": 14,
        "consultation_fee": 150.0,
        "bio": "Board-certified cardiologist specializing in preventive heart care and hypertension management.",
    },
    {
        "email": "dr.patel@example.com",
        "password": "Password123",
        "full_name": "Dr. Raj Patel",
        "phone": "+1-555-0202",
        "specialization": "General Medicine",
        "qualification": "MD, MBBS — Johns Hopkins",
        "experience_years": 11,
        "consultation_fee": 95.0,
        "bio": "Primary care physician focused on holistic wellness and chronic disease management.",
    },
    {
        "email": "dr.williams@example.com",
        "password": "Password123",
        "full_name": "Dr. Emily Williams",
        "phone": "+1-555-0203",
        "specialization": "Dermatology",
        "qualification": "MD, FAAD",
        "experience_years": 9,
        "consultation_fee": 120.0,
        "bio": "Expert in medical dermatology, acne treatment, and skin cancer screening.",
    },
    {
        "email": "dr.kumar@example.com",
        "password": "Password123",
        "full_name": "Dr. Arjun Kumar",
        "phone": "+1-555-0204",
        "specialization": "Pediatrics",
        "qualification": "MD, DCH",
        "experience_years": 12,
        "consultation_fee": 110.0,
        "bio": "Pediatrician with a gentle approach to child wellness and vaccination schedules.",
    },
    {
        "email": "dr.nguyen@example.com",
        "password": "Password123",
        "full_name": "Dr. Lisa Nguyen",
        "phone": "+1-555-0205",
        "specialization": "Neurology",
        "qualification": "MD, PhD — UCSF",
        "experience_years": 16,
        "consultation_fee": 175.0,
        "bio": "Neurologist specializing in migraines, epilepsy, and cognitive health.",
    },
]

MINIMAL_PDF = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 100 700 Td (Lumina Health Demo Record) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
0000000199 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
292
%%EOF"""


def _is_demo_seeded(db: Session, patient: Patient) -> bool:
    if patient.user and patient.user.phone != DEMO_MARKER_PHONE:
        return False
    record_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).count()
    return record_count >= 6


def _get_or_create_doctor(db: Session, spec: dict) -> Doctor:
    user = db.query(User).filter(User.email == spec["email"].lower()).first()
    if user is None:
        user = auth_service._create_user(
            db,
            UserRegisterRequest(
                email=spec["email"],
                password=spec["password"],
                full_name=spec["full_name"],
                phone=spec["phone"],
            ),
            RoleName.DOCTOR,
            is_approved=True,
        )
        from app.services import doctor_service

        doctor_service.create_doctor_profile(db, user)
        db.refresh(user)

    user.full_name = spec["full_name"]
    user.phone = spec["phone"]
    user.is_approved = True
    user.is_active = True
    db.commit()

    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    doctor.qualification = spec["qualification"]
    doctor.specialization = spec["specialization"]
    doctor.experience_years = spec["experience_years"]
    doctor.consultation_fee = spec["consultation_fee"]
    doctor.bio = spec["bio"]
    db.commit()

    existing_slots = db.query(DoctorAvailability).filter(DoctorAvailability.doctor_id == doctor.id).count()
    if existing_slots == 0:
        for day in range(0, 6):
            db.add(
                DoctorAvailability(
                    doctor_id=doctor.id,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    is_active=True,
                )
            )
        db.commit()
    return doctor


def _get_or_create_patient(db: Session) -> tuple[User, Patient]:
    user = (
        db.query(User)
        .options(joinedload(User.patient_profile))
        .join(Role)
        .filter(User.email == DEMO_PATIENT_EMAIL.lower(), Role.name == RoleName.PATIENT.value)
        .first()
    )
    if user is None:
        user = auth_service.register_patient(
            db,
            UserRegisterRequest(
                email=DEMO_PATIENT_EMAIL,
                password=DEMO_PATIENT_PASSWORD,
                full_name="Alex Morgan",
                phone=DEMO_MARKER_PHONE,
            ),
        )

    user.full_name = "Alex Morgan"
    user.phone = DEMO_MARKER_PHONE
    user.profile_photo_url = None
    user.language_preference = "en"
    user.is_active = True
    user.is_approved = True
    db.commit()
    db.refresh(user)

    patient = patient_service.get_patient_by_user_id(db, user.id)
    patient.date_of_birth = date(1990, 6, 15)
    patient.gender = "male"
    patient.blood_group = "O+"
    patient.emergency_contact_name = "Jordan Morgan"
    patient.emergency_contact_phone = "+1-555-0199"
    patient.allergies = "Penicillin, Shellfish"
    patient.medical_history = "Appendectomy (2015). Seasonal allergies since childhood."
    patient.existing_conditions = "Mild hypertension (controlled). Type 2 diabetes (diet-managed)."
    db.commit()
    db.refresh(patient)

    profile = db.query(EmergencyProfile).filter(EmergencyProfile.patient_id == patient.id).first()
    if profile is None:
        profile = EmergencyProfile(
            patient_id=patient.id,
            medical_id_number=generate_medical_id(),
        )
        db.add(profile)
        db.flush()
    profile.blood_group = patient.blood_group
    profile.allergies = patient.allergies
    profile.chronic_diseases = patient.existing_conditions
    profile.emergency_contact_name = patient.emergency_contact_name
    profile.emergency_contact_phone = patient.emergency_contact_phone
    profile.emergency_contact_relation = "Spouse"
    profile.additional_notes = "Carries EpiPen for shellfish allergy. Preferred hospital: Lumina General."
    db.commit()

    return user, patient


def _create_record(
    db: Session,
    *,
    patient_id: int,
    uploaded_by_user_id: int,
    record_type: str,
    title: str,
    description: str,
    file_name: str,
    content: bytes,
    mime_type: str,
    created_days_ago: int = 0,
) -> MedicalRecord:
    folder = RECORD_TYPE_FOLDERS[record_type]
    storage_key = storage_service.build_storage_key(folder, patient_id, file_name)
    storage_service.save_file(storage_key, content, mime_type)
    record = MedicalRecord(
        patient_id=patient_id,
        uploaded_by_user_id=uploaded_by_user_id,
        record_type=record_type,
        title=title,
        description=description,
        file_name=file_name,
        storage_key=storage_key,
        file_size=len(content),
        mime_type=mime_type,
        created_at=datetime.now(UTC) - timedelta(days=created_days_ago),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _seed_appointments(db: Session, patient: Patient, doctors: list[Doctor], user: User) -> None:
    if db.query(Appointment).filter(Appointment.patient_id == patient.id).count() >= 4:
        return

    primary = doctors[0]
    general = doctors[1]
    today = date.today()

    slots = [
        (primary, today + timedelta(days=2), time(10, 0), time(10, 30), AppointmentStatus.CONFIRMED.value, "Annual cardiac check-up", None),
        (general, today + timedelta(days=7), time(14, 0), time(14, 30), AppointmentStatus.PENDING.value, "Follow-up on blood work", None),
        (primary, today - timedelta(days=14), time(11, 0), time(11, 30), AppointmentStatus.COMPLETED.value, "Hypertension review", "Patient stable. Continue current medication."),
        (doctors[2], today - timedelta(days=30), time(9, 30), time(10, 0), AppointmentStatus.COMPLETED.value, "Skin screening", "Benign mole noted — monitor annually."),
        (general, today - timedelta(days=45), time(15, 0), time(15, 30), AppointmentStatus.CANCELLED.value, "General consultation", None),
    ]

    for doctor, appt_date, start, end, status, reason, notes in slots:
        exists = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id == patient.id,
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date == appt_date,
                Appointment.start_time == start,
            )
            .first()
        )
        if exists:
            continue
        appt = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            booked_by_user_id=user.id,
            appointment_date=appt_date,
            start_time=start,
            end_time=end,
            status=status,
            reason=reason,
            notes=notes,
            cancellation_reason="Schedule conflict" if status == AppointmentStatus.CANCELLED.value else None,
        )
        db.add(appt)
    db.commit()

    if db.query(AppointmentWaitlist).filter(AppointmentWaitlist.patient_id == patient.id).count() == 0:
        db.add(
            AppointmentWaitlist(
                patient_id=patient.id,
                doctor_id=doctors[4].id,
                booked_by_user_id=user.id,
                desired_date=today + timedelta(days=10),
                preferred_start_time=time(11, 0),
                reason="Migraine follow-up — preferred morning slot",
                status=WaitlistStatus.WAITING.value,
                position=1,
            )
        )
        db.commit()


def _seed_records(db: Session, patient: Patient, user: User, doctor_user: User) -> None:
    if db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).count() >= 6:
        return

    records = [
        (RecordType.LAB_REPORT.value, "Complete Blood Count — Jan 2026", "All values within normal range.", "cbc_jan2026.pdf", 30),
        (RecordType.DIAGNOSTIC_REPORT.value, "Metabolic Panel Results", "Glucose slightly elevated — lifestyle changes recommended.", "metabolic_panel.pdf", 28),
        (RecordType.XRAY.value, "Chest X-Ray", "Clear lungs. No abnormalities detected.", "chest_xray.pdf", 60),
        (RecordType.MRI.value, "Brain MRI — Migraine Protocol", "No structural abnormalities.", "brain_mri.pdf", 90),
        (RecordType.CTSCAN.value, "Abdominal CT Scan", "Normal abdominal scan.", "abdominal_ct.pdf", 120),
        (RecordType.PRESCRIPTION.value, "Pharmacy Receipt — Lisinopril", "Prescription fill confirmation.", "rx_receipt.pdf", 14),
    ]
    for rtype, title, desc, fname, days_ago in records:
        _create_record(
            db,
            patient_id=patient.id,
            uploaded_by_user_id=doctor_user.id,
            record_type=rtype,
            title=title,
            description=desc,
            file_name=fname,
            content=MINIMAL_PDF,
            mime_type="application/pdf",
            created_days_ago=days_ago,
        )


def _seed_prescriptions(db: Session, patient: Patient, doctor: Doctor) -> None:
    if db.query(Prescription).filter(Prescription.patient_id == patient.id).count() >= 2:
        return

    active_meds = json.dumps(
        [
            {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily", "duration": "90 days"},
            {"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily with meals", "duration": "90 days"},
            {"name": "Atorvastatin", "dosage": "20mg", "frequency": "Once daily at bedtime", "duration": "90 days"},
        ]
    )
    db.add(
        Prescription(
            patient_id=patient.id,
            doctor_id=doctor.id,
            diagnosis="Hypertension & hyperlipidemia management",
            medications=active_meds,
            instructions="Take Lisinopril in the morning. Metformin with breakfast and dinner. Avoid grapefruit with statin.",
            status=PrescriptionStatus.SHARED.value,
            created_at=datetime.now(UTC) - timedelta(days=14),
        )
    )

    past_meds = json.dumps(
        [
            {"name": "Amoxicillin", "dosage": "500mg", "frequency": "Three times daily", "duration": "7 days"},
        ]
    )
    db.add(
        Prescription(
            patient_id=patient.id,
            doctor_id=doctor.id,
            diagnosis="Acute sinus infection (resolved)",
            medications=past_meds,
            instructions="Completed full course. No refills needed.",
            status=PrescriptionStatus.SHARED.value,
            created_at=datetime.now(UTC) - timedelta(days=120),
        )
    )
    db.commit()


def _seed_medications(db: Session, patient: Patient, doctor: Doctor) -> None:
    if db.query(Medication).filter(Medication.patient_id == patient.id).count() >= 2:
        return

    today = date.today()
    meds_data = [
        ("Lisinopril", "10mg", "Once daily", "Take in the morning with water.", time(8, 0)),
        ("Metformin", "500mg", "Twice daily", "Take with meals to reduce stomach upset.", time(8, 30)),
        ("Vitamin D3", "2000 IU", "Once daily", "Supports bone health.", time(9, 0)),
    ]

    for name, dosage, frequency, instructions, sched_time in meds_data:
        med = Medication(
            patient_id=patient.id,
            doctor_id=doctor.id,
            name=name,
            dosage=dosage,
            frequency=frequency,
            instructions=instructions,
            start_date=today - timedelta(days=30),
            end_date=today + timedelta(days=60),
            is_active=True,
        )
        db.add(med)
        db.flush()
        db.add(
            MedicationSchedule(
                medication_id=med.id,
                time_of_day=sched_time,
                days_of_week="0,1,2,3,4,5,6",
                reminder_enabled=True,
            )
        )

    db.commit()

    lisinopril = db.query(Medication).filter(Medication.patient_id == patient.id, Medication.name == "Lisinopril").first()
    if lisinopril:
        for days_ago in range(1, 8):
            day = datetime.now(UTC).replace(hour=8, minute=0, second=0, microsecond=0) - timedelta(days=days_ago)
            status = MedicationLogStatus.TAKEN.value if days_ago != 3 else MedicationLogStatus.MISSED.value
            db.add(
                MedicationLog(
                    medication_id=lisinopril.id,
                    scheduled_for=day,
                    status=status,
                    taken_at=day + timedelta(minutes=5) if status == MedicationLogStatus.TAKEN.value else None,
                )
            )
        db.commit()


def _seed_vitals(db: Session, patient: Patient) -> None:
    if db.query(VitalSign).filter(VitalSign.patient_id == patient.id).count() >= 5:
        return

    now = datetime.now(UTC)
    vitals = [
        (VitalType.BLOOD_PRESSURE.value, 122.0, 78.0, "mmHg", "Resting, seated", 0),
        (VitalType.HEART_RATE.value, 72.0, None, "bpm", "Morning reading", 0),
        (VitalType.WEIGHT.value, 78.5, None, "kg", None, 0),
        (VitalType.BLOOD_SUGAR.value, 105.0, None, "mg/dL", "Fasting", 1),
        (VitalType.OXYGEN.value, 98.0, None, "%", "Room air", 0),
        (VitalType.BLOOD_PRESSURE.value, 118.0, 76.0, "mmHg", None, 7),
        (VitalType.WEIGHT.value, 79.0, None, "kg", None, 14),
        (VitalType.HEART_RATE.value, 68.0, None, "bpm", None, 3),
    ]
    for vtype, val, sec, unit, notes, days_ago in vitals:
        db.add(
            VitalSign(
                patient_id=patient.id,
                vital_type=vtype,
                value=val,
                secondary_value=sec,
                unit=unit,
                notes=notes,
                recorded_at=now - timedelta(days=days_ago),
            )
        )
    db.commit()


def _seed_family(db: Session, patient: Patient, user: User) -> None:
    if db.query(FamilyMember).filter(FamilyMember.guardian_patient_id == patient.id).count() >= 1:
        return

    from app.schemas.family import FamilyMemberCreateRequest
    from app.services import family_service

    family_service.create_family_member(
        db,
        patient,
        FamilyMemberCreateRequest(
            full_name="Emma Morgan",
            relationship=FamilyRelationship.CHILD.value,
            nickname="Em",
            date_of_birth=date(2016, 3, 22),
            gender="female",
            blood_group="A+",
            allergies="Peanuts",
            chronic_diseases="Mild asthma",
            emergency_contact_name="Alex Morgan",
            emergency_contact_phone=DEMO_MARKER_PHONE,
            can_share_records=True,
        ),
    )


def _seed_notifications(db: Session, user: User) -> None:
    if db.query(Notification).filter(Notification.user_id == user.id).count() >= 3:
        return

    now = datetime.now(UTC)
    items = [
        ("appointment_reminder", "Appointment Reminder", "Your cardiology check-up with Dr. Sarah Chen is in 2 days at 10:00 AM.", NotificationChannel.EMAIL.value),
        ("medication_reminder", "Medication Reminder", "Time to take Lisinopril 10mg.", NotificationChannel.EMAIL.value),
        ("record_uploaded", "New Record Available", "Your metabolic panel results have been uploaded to your health locker.", NotificationChannel.EMAIL.value),
        ("system_welcome", "Welcome to Lumina Health", "Your account is set up. Explore your dashboard to book appointments and track vitals.", NotificationChannel.EMAIL.value),
    ]
    for event_type, title, message, channel in items:
        db.add(
            Notification(
                user_id=user.id,
                channel=channel,
                event_type=event_type,
                title=title,
                message=message,
                status=NotificationStatus.SENT.value,
                sent_at=now,
            )
        )
    db.commit()


def repair_missing_demo_record_files(db: Session) -> int:
    """Re-upload demo PDFs when blob storage is missing (e.g. after Render redeploy)."""
    patient = (
        db.query(Patient)
        .join(User)
        .filter(User.phone == DEMO_MARKER_PHONE)
        .first()
    )
    if not patient:
        return 0

    repaired = 0
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).all()
    for record in records:
        if repair_demo_record_file(db, record):
            repaired += 1

    if repaired:
        db.commit()
        logger.info("Repaired %d demo medical record file(s) in storage", repaired)
    return repaired


def repair_demo_record_file(db: Session, record: MedicalRecord) -> bool:
    """Re-upload a single demo record PDF if its blob is missing. Returns True if repaired."""
    patient = (
        db.query(Patient)
        .join(User)
        .filter(Patient.id == record.patient_id, User.phone == DEMO_MARKER_PHONE)
        .first()
    )
    if not patient:
        return False

    try:
        storage_service.read_file(record.storage_key)
        return False
    except FileNotFoundError:
        pass
    except (OSError, RuntimeError) as exc:
        logger.warning("Storage read failed for record %s: %s", record.id, exc)

    folder = RECORD_TYPE_FOLDERS.get(record.record_type, "documents")
    new_key = storage_service.build_storage_key(folder, record.patient_id, record.file_name)
    mime = record.mime_type or "application/pdf"
    storage_service.save_file(new_key, MINIMAL_PDF, mime)
    record.storage_key = new_key
    record.file_size = len(MINIMAL_PDF)
    return True


def seed_demo_data(db: Session, *, force: bool = False) -> None:
    """Populate demo patient and related clinical data (idempotent)."""
    if not settings.SEED_DEMO_DATA and not force:
        return

    user, patient = _get_or_create_patient(db)
    if _is_demo_seeded(db, patient) and not force:
        return

    doctors = [_get_or_create_doctor(db, spec) for spec in DOCTORS]
    doctor_user = doctors[0].user

    _seed_appointments(db, patient, doctors, user)
    _seed_records(db, patient, user, doctor_user)
    _seed_prescriptions(db, patient, doctors[0])
    _seed_medications(db, patient, doctors[0])
    _seed_vitals(db, patient)
    _seed_family(db, patient, user)
    _seed_notifications(db, user)

    timeline_service.sync_timeline_cache(db, patient.id)

    for dep in patient.managed_family:
        if dep.dependent_patient_id:
            timeline_service.sync_timeline_cache(db, dep.dependent_patient_id)
