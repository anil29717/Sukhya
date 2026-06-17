import { client } from './client';
import { DigitalLockerSummary, FamilyMember, Notification, PaginatedResponse } from './types';

export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const { data } = await client.get<FamilyMember[]>('/family/members');
  return data;
}

export async function getFamilyMember(id: number): Promise<FamilyMember> {
  const { data } = await client.get<FamilyMember>(`/family/members/${id}`);
  return data;
}

export async function createFamilyMember(payload: {
  full_name: string;
  relationship: string;
  nickname?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  chronic_diseases?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}): Promise<FamilyMember> {
  const { data } = await client.post<FamilyMember>('/family/members', payload);
  return data;
}

export async function updateFamilyMember(
  id: number,
  payload: Partial<{
    full_name: string;
    relationship: string;
    nickname: string;
    date_of_birth: string;
    gender: string;
    blood_group: string;
    allergies: string;
    chronic_diseases: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    can_share_records: boolean;
    is_active: boolean;
  }>
): Promise<FamilyMember> {
  const { data } = await client.put<FamilyMember>(`/family/members/${id}`, payload);
  return data;
}

export async function deleteFamilyMember(id: number): Promise<void> {
  await client.delete(`/family/members/${id}`);
}

export async function getNotifications(page = 1): Promise<PaginatedResponse<Notification>> {
  const { data } = await client.get<PaginatedResponse<Notification>>('/notifications/me', {
    params: { page },
  });
  return data;
}

export async function getLockerSummary(patientId?: number): Promise<DigitalLockerSummary> {
  const { data } = await client.get<DigitalLockerSummary>('/digital-locker/summary', {
    params: patientId ? { patient_id: patientId } : undefined,
  });
  return data;
}

export async function getLockerDownloads(): Promise<Array<{ medical_record_id: number }>> {
  const { data } = await client.get<Array<{ medical_record_id: number }>>('/digital-locker/downloads');
  return data;
}
