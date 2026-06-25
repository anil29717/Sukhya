import { apiFetch } from './client';

export function getFamilyMembers() {
  return apiFetch('/family/members');
}

export function getFamilyDashboard() {
  return apiFetch('/family/dashboard');
}

export function addFamilyMember(payload) {
  return apiFetch('/family/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFamilyMember(id, payload) {
  return apiFetch(`/family/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteFamilyMember(id) {
  return apiFetch(`/family/members/${id}`, {
    method: 'DELETE',
  });
}

export function getEmergencyProfile() {
  return apiFetch('/family/emergency/me');
}

export function updateEmergencyProfile(payload) {
  return apiFetch('/family/emergency/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getEmergencyCard(familyMemberId) {
  const query = familyMemberId != null
    ? `?family_member_id=${encodeURIComponent(familyMemberId)}`
    : '';
  return apiFetch(`/family/emergency/card${query}`);
}

export function updateFamilyMemberEmergency(id, payload) {
  return apiFetch(`/family/emergency/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
