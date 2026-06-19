import { client } from './client';
import { DoctorNote } from './types';

export async function listDoctorNotes(params?: {
  patient_id?: number;
  appointment_id?: number;
  note_type?: string;
  page?: number;
}): Promise<DoctorNote[]> {
  const { data } = await client.get<DoctorNote[]>('/doctor-notes', { params });
  return data;
}

export async function getDoctorNote(id: number): Promise<DoctorNote> {
  const { data } = await client.get<DoctorNote>(`/doctor-notes/${id}`);
  return data;
}

export async function createDoctorNote(payload: {
  patient_id: number;
  appointment_id?: number;
  note_type: string;
  title: string;
  content: string;
  is_private?: boolean;
}): Promise<DoctorNote> {
  const { data } = await client.post<DoctorNote>('/doctor-notes', payload);
  return data;
}

export async function updateDoctorNote(
  id: number,
  payload: Partial<{
    note_type: string;
    title: string;
    content: string;
    is_private: boolean;
    appointment_id: number;
  }>
): Promise<DoctorNote> {
  const { data } = await client.put<DoctorNote>(`/doctor-notes/${id}`, payload);
  return data;
}

export async function deleteDoctorNote(id: number): Promise<void> {
  await client.delete(`/doctor-notes/${id}`);
}
