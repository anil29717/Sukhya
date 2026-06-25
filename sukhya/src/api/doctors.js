import { apiJson } from './client';

export function listDoctors(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/doctors${query ? `?${query}` : ''}`);
}

export function getDoctor(doctorId) {
  return apiJson(`/doctors/${doctorId}`);
}

export function getMyDoctorProfile() {
  return apiJson('/doctors/me');
}

export function updateMyDoctorProfile(payload) {
  return apiJson('/doctors/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getMyAvailability() {
  return apiJson('/doctors/me/availability');
}

export function updateMyAvailability(payload) {
  return apiJson('/doctors/me/availability', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getMyLeaves() {
  return apiJson('/doctors/me/leaves');
}

export function addLeave(payload) {
  return apiJson('/doctors/me/leaves', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteLeave(leaveId) {
  return apiJson(`/doctors/me/leaves/${leaveId}`, { method: 'DELETE' });
}

export function getSchedulingSettings() {
  return apiJson('/doctors/me/scheduling');
}

export function updateSchedulingSettings(payload) {
  return apiJson('/doctors/me/scheduling', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getDoctorAnalytics(days = 30) {
  return apiJson(`/doctors/me/analytics?days=${days}`);
}

export function getPatientHistory(patientId) {
  return apiJson(`/doctors/me/patients/${patientId}/history`);
}
