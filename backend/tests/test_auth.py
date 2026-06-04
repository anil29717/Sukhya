import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import User, RoleName, Role

def test_patient_registration(client: TestClient, db_session: Session):
    reg_data = {
        "email": "new_patient@example.com",
        "password": "SecretPassword123",
        "full_name": "New Patient",
        "phone": "+1234567890",
        "language_preference": "en"
    }
    response = client.post("/api/v1/auth/register/patient", json=reg_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["email"] == "new_patient@example.com"
    assert data["full_name"] == "New Patient"
    assert data["role"]["name"] == RoleName.PATIENT.value

def test_login_success(client: TestClient, test_patient: User):
    login_data = {
        "email": "test_patient@example.com",
        "password": "Password123"
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client: TestClient, test_patient: User):
    login_data = {
        "email": "test_patient@example.com",
        "password": "WrongPassword"
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"

def test_profile_retrieval(client: TestClient, patient_headers: dict):
    response = client.get("/api/v1/users/me", headers=patient_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test_patient@example.com"
