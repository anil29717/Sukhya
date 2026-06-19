import { client } from './client';
import { PaginatedResponse, PatientListItem, PatientResponse } from './types';

export async function getMyPatientProfile(): Promise<PatientResponse> {
  const { data } = await client.get<PatientResponse>('/patients/me');
  return data;
}

export async function updateMyProfile(payload: {
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}): Promise<PatientResponse> {
  const { data } = await client.put<PatientResponse>('/patients/me', payload);
  return data;
}

export async function updateMedicalInfo(payload: {
  allergies?: string;
  medical_history?: string;
  existing_conditions?: string;
}): Promise<PatientResponse> {
  const { data } = await client.put<PatientResponse>('/patients/me/medical', payload);
  return data;
}

export async function searchPatients(params?: {
  search?: string;
  gender?: string;
  blood_group?: string;
  page?: number;
}): Promise<PaginatedResponse<PatientListItem>> {
  const { data } = await client.get<PaginatedResponse<PatientListItem>>('/patients', { params });
  return data;
}

export async function getPatient(patientId: number): Promise<PatientResponse> {
  const { data } = await client.get<PatientResponse>(`/patients/${patientId}`);
  return data;
}
