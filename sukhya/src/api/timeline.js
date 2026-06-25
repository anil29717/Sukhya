import { apiFetch } from './client';

export function getHealthTimeline(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ''),
  ).toString();
  return apiFetch(`/health-timeline${query ? `?${query}` : ''}`);
}
