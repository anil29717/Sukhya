import pytest
from datetime import date, time, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import User, Appointment

def test_appointment_booking_and_double_booking(client: TestClient, db_session: Session, test_patient: User, test_doctor: User, patient_headers: dict, doctor_headers: dict):
    # 1. Doctor sets their availability for Monday (0)
    avail_data = {
        "slots": [
            {
                "day_of_week": 0,
                "start_time": "09:00:00",
                "end_time": "12:00:00",
                "is_active": True
            }
        ]
    }
    response = client.put("/api/v1/doctors/me/availability", json=avail_data, headers=doctor_headers)
    assert response.status_code == 200

    # Get a date that is a Monday in the future
    today = date.today()
    days_ahead = 0 - today.weekday()
    if days_ahead <= 0: # Target next Monday
        days_ahead += 7
    target_monday = today + timedelta(days=days_ahead)

    # 2. Patient queries doctor's available slots
    response = client.get(
        f"/api/v1/appointments/doctors/{test_doctor.doctor_profile.id}/slots",
        params={"appointment_date": target_monday.isoformat()},
        headers=patient_headers
    )
    assert response.status_code == 200
    slots = response.json()["slots"]
    assert len(slots) > 0
    target_slot = slots[0]["start_time"] # e.g. "09:00:00"

    # 3. Patient books the appointment slot
    booking_data = {
        "doctor_id": test_doctor.doctor_profile.id,
        "appointment_date": target_monday.isoformat(),
        "start_time": target_slot,
        "reason": "Test Consultation"
    }
    response = client.post("/api/v1/appointments", json=booking_data, headers=patient_headers)
    assert response.status_code == 201
    appt_id = response.json()["id"]

    # 4. Patient tries to double-book the same slot -> Should fail
    response = client.post("/api/v1/appointments", json=booking_data, headers=patient_headers)
    assert response.status_code == 409
    assert "already booked" in response.json()["detail"]

    # 5. Patient cancels the appointment
    cancel_data = {
        "cancellation_reason": "No longer needed"
    }
    response = client.post(f"/api/v1/appointments/{appt_id}/cancel", json=cancel_data, headers=patient_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
