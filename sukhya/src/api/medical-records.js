import { apiFetch, apiJson } from './client';

export function listMedicalRecords(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/medical-records${query ? `?${query}` : ''}`);
}

export function getMedicalRecord(recordId) {
  return apiJson(`/medical-records/${recordId}`);
}

export async function uploadMedicalRecord(formData) {
  const response = await apiFetch('/medical-records', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail ?? 'Upload failed');
  return data;
}

export function downloadMedicalRecord(recordId) {
  return apiFetch(`/medical-records/${recordId}/download`);
}

export function deleteMedicalRecord(recordId) {
  return apiFetch(`/medical-records/${recordId}`, { method: 'DELETE' });
}
