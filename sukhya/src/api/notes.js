import { apiJson } from './client';

export function listDoctorNotes(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/doctor-notes${query ? `?${query}` : ''}`);
}

export function getDoctorNote(noteId) {
  return apiJson(`/doctor-notes/${noteId}`);
}

export function createDoctorNote(payload) {
  return apiJson('/doctor-notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDoctorNote(noteId, payload) {
  return apiJson(`/doctor-notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteDoctorNote(noteId) {
  return apiJson(`/doctor-notes/${noteId}`, { method: 'DELETE' });
}
