import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import User

def test_log_and_list_vitals(client: TestClient, db_session: Session, test_patient: User, patient_headers: dict):
    # 1. Patient logs heart rate vital
    vital_data = {
        "vital_type": "heart_rate",
        "value": 72.0,
        "unit": "bpm",
        "notes": "Resting heart rate"
    }
    
    response = client.post("/api/v1/vitals", json=vital_data, headers=patient_headers)
    assert response.status_code == 201
    assert response.json()["vital_type"] == "heart_rate"
    assert response.json()["value"] == 72.0

    # 2. Patient lists their vital signs
    response = client.get("/api/v1/vitals", headers=patient_headers)
    assert response.status_code == 200
    vitals = response.json()
    assert len(vitals) > 0
    assert vitals[0]["vital_type"] == "heart_rate"

    # 3. Patient queries trends for heart rate
    response = client.get(
        "/api/v1/vitals/trends",
        params={"vital_type": "heart_rate", "days": 7},
        headers=patient_headers
    )
    assert response.status_code == 200
    trends = response.json()
    assert trends["vital_type"] == "heart_rate"
    assert len(trends["points"]) > 0
    assert trends["points"][0]["value"] == 72.0
