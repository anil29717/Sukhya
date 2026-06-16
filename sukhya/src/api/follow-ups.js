import { apiJson } from './client';

export function listFollowUps(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/follow-ups${query ? `?${query}` : ''}`);
}

export function createFollowUp(payload) {
  return apiJson('/follow-ups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFollowUp(followUpId, payload) {
  return apiJson(`/follow-ups/${followUpId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
