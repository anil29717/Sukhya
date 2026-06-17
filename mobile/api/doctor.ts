import { client } from './client';
import {
  AvailabilitySlot,
  DoctorAnalytics,
  DoctorLeave,
  DoctorProfile,
  DoctorSchedulingSettings,
  PatientHistoryResponse,
} from './types';

export async function getMyDoctorProfile(): Promise<DoctorProfile> {
  const { data } = await client.get<DoctorProfile>('/doctors/me');
  return data;
}

export async function updateMyDoctorProfile(payload: {
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
}): Promise<DoctorProfile> {
  const { data } = await client.put<DoctorProfile>('/doctors/me', payload);
  return data;
}

export async function getDoctorAnalytics(days = 30): Promise<DoctorAnalytics> {
  const { data } = await client.get<DoctorAnalytics>('/doctors/me/analytics', { params: { days } });
  return data;
}

export async function getAvailability(): Promise<AvailabilitySlot[]> {
  const { data } = await client.get<AvailabilitySlot[]>('/doctors/me/availability');
  return data;
}

export async function updateAvailability(
  slots: Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }>
): Promise<AvailabilitySlot[]> {
  const { data } = await client.put<AvailabilitySlot[]>('/doctors/me/availability', { slots });
  return data;
}

export async function getLeaves(): Promise<DoctorLeave[]> {
  const { data } = await client.get<DoctorLeave[]>('/doctors/me/leaves');
  return data;
}

export async function createLeave(payload: {
  start_date: string;
  end_date: string;
  reason?: string;
}): Promise<DoctorLeave> {
  const { data } = await client.post<DoctorLeave>('/doctors/me/leaves', payload);
  return data;
}

export async function deleteLeave(leaveId: number): Promise<void> {
  await client.delete(`/doctors/me/leaves/${leaveId}`);
}

export async function getSchedulingSettings(): Promise<DoctorSchedulingSettings> {
  const { data } = await client.get<DoctorSchedulingSettings>('/doctors/me/scheduling');
  return data;
}

export async function updateSchedulingSettings(payload: {
  slot_buffer_minutes?: number;
  max_appointments_per_day?: number;
}): Promise<DoctorSchedulingSettings> {
  const { data } = await client.put<DoctorSchedulingSettings>('/doctors/me/scheduling', payload);
  return data;
}

export async function getPatientHistory(patientId: number): Promise<PatientHistoryResponse> {
  const { data } = await client.get<PatientHistoryResponse>(`/doctors/me/patients/${patientId}/history`);
  return data;
}
