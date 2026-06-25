import { apiJson } from './client';

export function getMyPatientProfile() {
  return apiJson('/patients/me');
}

export function updateMyPatientProfile(payload) {
  return apiJson('/patients/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateMyMedicalInfo(payload) {
  return apiJson('/patients/me/medical', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function listPatients(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/patients${query ? `?${query}` : ''}`);
}

export function getPatient(patientId) {
  return apiJson(`/patients/${patientId}`);
}
