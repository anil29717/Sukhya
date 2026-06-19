import { apiFetch } from './client';

export function logVital(payload) {
  return apiFetch('/vitals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getVitals(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ''),
  ).toString();
  return apiFetch(`/vitals${query ? `?${query}` : ''}`);
}

export function getVitalTrends(vitalType, days) {
  const query = new URLSearchParams({
    vital_type: vitalType,
    days: String(days),
  }).toString();
  return apiFetch(`/vitals/trends?${query}`);
}
