import { client } from './client';
import { Doctor, PaginatedResponse } from './types';

export async function listDoctors(params?: {
  search?: string;
  specialization?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Doctor>> {
  const { data } = await client.get<PaginatedResponse<Doctor>>('/doctors', { params });
  return data;
}

export async function getDoctor(id: number): Promise<Doctor> {
  const { data } = await client.get<Doctor>(`/doctors/${id}`);
  return data;
}
