import pytest
from fastapi.testclient import TestClient

def test_unauthenticated_request(client: TestClient):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_patient_cannot_access_doctor_routes(client: TestClient, patient_headers: dict):
    # Patient tries to get doctor personal availability
    response = client.get("/api/v1/doctors/me/availability", headers=patient_headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_patient_cannot_access_admin_routes(client: TestClient, patient_headers: dict):
    # Patient tries to list pending doctors
    response = client.get("/api/v1/admin/doctors/pending", headers=patient_headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_doctor_cannot_access_admin_routes(client: TestClient, doctor_headers: dict):
    response = client.get("/api/v1/admin/doctors/pending", headers=doctor_headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_admin_can_access_admin_routes(client: TestClient, admin_headers: dict):
    response = client.get("/api/v1/admin/doctors/pending", headers=admin_headers)
    assert response.status_code == 200
