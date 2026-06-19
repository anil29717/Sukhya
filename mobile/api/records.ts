import { client } from './client';
import { MedicalRecord, PaginatedResponse } from './types';

export async function listMedicalRecords(params?: {
  patient_id?: number;
  record_type?: string;
  page?: number;
}): Promise<PaginatedResponse<MedicalRecord>> {
  const { data } = await client.get<PaginatedResponse<MedicalRecord>>('/medical-records', { params });
  return data;
}

export async function getMedicalRecord(id: number): Promise<MedicalRecord> {
  const { data } = await client.get<MedicalRecord>(`/medical-records/${id}`);
  return data;
}

export async function uploadMedicalRecord(formData: FormData): Promise<MedicalRecord> {
  const { data } = await client.post<MedicalRecord>('/medical-records', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteMedicalRecord(id: number): Promise<void> {
  await client.delete(`/medical-records/${id}`);
}
