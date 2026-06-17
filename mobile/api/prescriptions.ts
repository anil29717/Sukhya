import { client } from './client';
import { PaginatedResponse, Prescription } from './types';

export async function listPrescriptions(params?: {
  patient_id?: number;
  page?: number;
}): Promise<PaginatedResponse<Prescription>> {
  const { data } = await client.get<PaginatedResponse<Prescription>>('/prescriptions', { params });
  return data;
}

export async function getPrescription(id: number): Promise<Prescription> {
  const { data } = await client.get<Prescription>(`/prescriptions/${id}`);
  return data;
}

export async function createPrescription(payload: {
  patient_id: number;
  appointment_id?: number;
  diagnosis?: string;
  medications: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }>;
  instructions?: string;
  notes?: string;
}): Promise<Prescription> {
  const { data } = await client.post<Prescription>('/prescriptions', payload);
  return data;
}

export async function updatePrescription(
  id: number,
  payload: Partial<{
    diagnosis: string;
    medications: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }>;
    instructions: string;
  }>
): Promise<Prescription> {
  const { data } = await client.put<Prescription>(`/prescriptions/${id}`, payload);
  return data;
}

export async function sharePrescription(id: number): Promise<Prescription> {
  const { data } = await client.post<Prescription>(`/prescriptions/${id}/share`);
  return data;
}
