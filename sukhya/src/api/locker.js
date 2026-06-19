import { apiFetch } from './client';

export function getLockerSummary() {
  return apiFetch('/digital-locker/summary');
}

export function getLocker() {
  return apiFetch('/digital-locker');
}

export function getLockerDownloads(page) {
  const query = page != null ? `?page=${page}` : '';
  return apiFetch(`/digital-locker/downloads${query}`);
}

export function getLockerAccessLogs(page) {
  const query = page != null ? `?page=${page}` : '';
  return apiFetch(`/digital-locker/access-logs${query}`);
}

export function getFamilySharedRecords() {
  return apiFetch('/digital-locker/family-shared');
}
