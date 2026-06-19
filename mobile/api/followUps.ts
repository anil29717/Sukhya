import { client } from './client';
import { FollowUp } from './types';

export async function listFollowUps(params?: {
  patient_id?: number;
  status?: string;
  page?: number;
}): Promise<FollowUp[]> {
  const { data } = await client.get<FollowUp[]>('/follow-ups', { params });
  return data;
}

export async function createFollowUp(payload: {
  patient_id: number;
  source_appointment_id?: number;
  scheduled_date: string;
  scheduled_time?: string;
  reason?: string;
  notes?: string;
}): Promise<FollowUp> {
  const { data } = await client.post<FollowUp>('/follow-ups', payload);
  return data;
}

export async function updateFollowUp(
  id: number,
  payload: Partial<{
    scheduled_date: string;
    scheduled_time: string;
    reason: string;
    notes: string;
    status: string;
  }>
): Promise<FollowUp> {
  const { data } = await client.put<FollowUp>(`/follow-ups/${id}`, payload);
  return data;
}
