import { client } from './client';
import { Appointment, AvailableSlotsResponse, PaginatedResponse, WaitlistEntry } from './types';

export async function getDoctorSlots(doctorId: number, appointmentDate: string): Promise<AvailableSlotsResponse> {
  const { data } = await client.get<AvailableSlotsResponse>(`/appointments/doctors/${doctorId}/slots`, {
    params: { appointment_date: appointmentDate },
  });
  return data;
}

export async function bookAppointment(payload: {
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  reason?: string;
  family_member_id?: number;
}): Promise<Appointment> {
  const { data } = await client.post<Appointment>('/appointments', payload);
  return data;
}

export async function getUpcomingAppointments(page = 1): Promise<PaginatedResponse<Appointment>> {
  const { data } = await client.get<PaginatedResponse<Appointment>>('/appointments/upcoming', {
    params: { page },
  });
  return data;
}

export async function getCompletedAppointments(page = 1): Promise<PaginatedResponse<Appointment>> {
  const { data } = await client.get<PaginatedResponse<Appointment>>('/appointments/completed', {
    params: { page },
  });
  return data;
}

export async function getCancelledAppointments(page = 1): Promise<PaginatedResponse<Appointment>> {
  const { data } = await client.get<PaginatedResponse<Appointment>>('/appointments/history', {
    params: { page, status: 'cancelled' },
  });
  return data;
}

export async function getAppointment(id: number): Promise<Appointment> {
  const { data } = await client.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function cancelAppointment(id: number, reason?: string): Promise<Appointment> {
  const { data } = await client.post<Appointment>(`/appointments/${id}/cancel`, {
    cancellation_reason: reason,
  });
  return data;
}

export async function rescheduleAppointment(
  id: number,
  payload: { appointment_date: string; start_time: string; reason?: string }
): Promise<Appointment> {
  const { data } = await client.post<Appointment>(`/appointments/${id}/reschedule`, payload);
  return data;
}

export async function quickRebook(id: number): Promise<Appointment> {
  const { data } = await client.post<Appointment>(`/appointments/${id}/quick-rebook`);
  return data;
}

export async function getWaitlist(): Promise<WaitlistEntry[]> {
  const { data } = await client.get<WaitlistEntry[]>('/appointments/waitlist');
  return data;
}

export async function joinWaitlist(payload: {
  doctor_id: number;
  desired_date: string;
  reason?: string;
}): Promise<WaitlistEntry> {
  const { data } = await client.post<WaitlistEntry>('/appointments/waitlist', payload);
  return data;
}

export async function leaveWaitlist(waitlistId: number): Promise<void> {
  await client.delete(`/appointments/waitlist/${waitlistId}`);
}

export async function getTodayAppointments(): Promise<PaginatedResponse<Appointment>> {
  const { data } = await client.get<PaginatedResponse<Appointment>>('/appointments/today');
  return data;
}

export async function getAppointmentHistory(params?: {
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
}): Promise<PaginatedResponse<Appointment>> {
  const { data } = await client.get<PaginatedResponse<Appointment>>('/appointments/history', { params });
  return data;
}

export async function confirmAppointment(id: number): Promise<Appointment> {
  const { data } = await client.post<Appointment>(`/appointments/${id}/confirm`);
  return data;
}

export async function completeAppointment(id: number, notes?: string): Promise<Appointment> {
  const { data } = await client.post<Appointment>(`/appointments/${id}/complete`, { notes });
  return data;
}
