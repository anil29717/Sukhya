import { apiFetch, apiJson } from './client';

export function listPrescriptions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/prescriptions${query ? `?${query}` : ''}`);
}

export function getPrescription(prescriptionId) {
  return apiJson(`/prescriptions/${prescriptionId}`);
}

export function createPrescription(payload) {
  return apiJson('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePrescription(prescriptionId, payload) {
  return apiJson(`/prescriptions/${prescriptionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function sharePrescription(prescriptionId) {
  return apiJson(`/prescriptions/${prescriptionId}/share`, { method: 'POST' });
}

export async function uploadPrescriptionDocument(prescriptionId, formData) {
  const response = await apiFetch(`/prescriptions/${prescriptionId}/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail ?? 'Upload failed');
  return data;
}

export function downloadPrescription(prescriptionId) {
  return apiFetch(`/prescriptions/${prescriptionId}/download`);
}
