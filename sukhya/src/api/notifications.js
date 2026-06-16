import { apiJson } from './client';

export function listNotifications(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/notifications/me${query ? `?${query}` : ''}`);
}
