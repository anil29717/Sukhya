import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import User

def test_medical_record_upload_and_scope(client: TestClient, db_session: Session, test_patient: User, patient_headers: dict):
    # 1. Patient uploads their own record
    upload_data = {
        "patient_id": str(test_patient.patient_profile.id),
        "record_type": "prescription",
        "title": "My Prescription",
        "description": "Routine medication list"
    }
    files = {
        "file": ("prescription.pdf", b"pdf mock contents", "application/pdf")
    }
    
    response = client.post(
        "/api/v1/medical-records",
        data=upload_data,
        files=files,
        headers=patient_headers
    )
    assert response.status_code == 201
    record_id = response.json()["id"]

    # 2. Patient lists their own medical records
    response = client.get("/api/v1/medical-records", headers=patient_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) > 0
    assert items[0]["title"] == "My Prescription"

    # 3. Create another patient to test security boundaries
    from app.services import auth_service
    from app.schemas.auth import UserRegisterRequest
    other_reg = UserRegisterRequest(
        email="other_patient@example.com",
        password="Password123",
        full_name="Other Patient",
        phone="+1555000000",
        language_preference="en"
    )
    other_patient = auth_service.register_patient(db_session, other_reg)
    from app.core.security import create_access_token
    other_token = create_access_token(subject=str(other_patient.id), role=other_patient.role.name)
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # 4. Other patient attempts to access Patient A's record -> Should fail
    response = client.get(f"/api/v1/medical-records/{record_id}", headers=other_headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

    # 5. Patient A downloads their own file
    response = client.get(f"/api/v1/medical-records/{record_id}/download", headers=patient_headers)
    assert response.status_code == 200
    assert response.content == b"pdf mock contents"

    # 6. Verify audit access log exists for patient downloading
    response = client.get("/api/v1/digital-locker/access-logs", headers=patient_headers)
    assert response.status_code == 200
    access_logs = response.json()
    assert len(access_logs) > 0
    assert access_logs[0]["action"] == "view"
