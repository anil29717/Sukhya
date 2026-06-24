import { client } from './client';
import { PaginatedResponse, TimelineEvent } from './types';

export async function getHealthTimeline(params?: {
  patient_id?: number;
  event_type?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<TimelineEvent>> {
  const { data } = await client.get<PaginatedResponse<TimelineEvent>>('/health-timeline', { params });
  return data;
}
