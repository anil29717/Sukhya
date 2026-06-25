import { apiFetch } from './client';

export function getMedications(activeOnly) {
  const query = activeOnly != null
    ? `?active_only=${activeOnly ? 'true' : 'false'}`
    : '';
  return apiFetch(`/medications${query}`);
}

export function addMedication(payload) {
  return apiFetch('/medications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMedication(id, payload) {
  return apiFetch(`/medications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function logDose(id, payload) {
  return apiFetch(`/medications/${id}/log`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMedicationLogs(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ''),
  ).toString();
  return apiFetch(`/medications/logs${query ? `?${query}` : ''}`);
}

export function getDueReminders() {
  return apiFetch('/medications/reminders/due');
}
