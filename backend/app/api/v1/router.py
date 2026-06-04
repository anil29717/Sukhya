from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    appointments,
    auth,
    doctor_clinical,
    doctor_notes,
    doctors,
    family,
    follow_ups,
    locker,
    medical_records,
    medications,
    notifications,
    patients,
    prescriptions,
    scheduling,
    timeline,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(patients.router)
api_router.include_router(family.router)
api_router.include_router(timeline.router)
api_router.include_router(locker.router)
api_router.include_router(medications.router)
api_router.include_router(medications.vitals_router)
api_router.include_router(doctors.router)
api_router.include_router(doctor_clinical.router)
api_router.include_router(doctors.admin_router)
api_router.include_router(doctor_notes.router)
api_router.include_router(follow_ups.router)
api_router.include_router(scheduling.doctor_scheduling_router)
api_router.include_router(scheduling.router)
api_router.include_router(appointments.router)
api_router.include_router(medical_records.router)
api_router.include_router(prescriptions.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
