import { client } from './client';
import { Medication, MedicationLog, MedicationReminder } from './types';

export async function listMedications(params?: {
  patient_id?: number;
  active_only?: boolean;
}): Promise<Medication[]> {
  const { data } = await client.get<Medication[]>('/medications', { params });
  return data;
}

export async function logMedicationDose(
  medicationId: number,
  payload: { scheduled_for: string; status: 'taken' | 'missed' | 'skipped'; notes?: string }
): Promise<void> {
  await client.post(`/medications/${medicationId}/log`, payload);
}

export async function getMedicationLogs(params?: {
  patient_id?: number;
  medication_id?: number;
}): Promise<MedicationLog[]> {
  const { data } = await client.get<MedicationLog[]>('/medications/logs', { params });
  return data;
}

export async function getDueReminders(): Promise<MedicationReminder[]> {
  const { data } = await client.get<MedicationReminder[]>('/medications/reminders/due');
  return data;
}

export async function listVitals(params?: { patient_id?: number }): Promise<import('./types').VitalSign[]> {
  const { data } = await client.get<import('./types').VitalSign[]>('/vitals', { params });
  return data;
}

export async function createVital(payload: {
  vital_type: string;
  value: string;
  unit?: string;
  notes?: string;
  patient_id?: number;
}): Promise<import('./types').VitalSign> {
  const { data } = await client.post<import('./types').VitalSign>('/vitals', payload);
  return data;
}

export async function getVitalTrends(vitalType: string, days = 30): Promise<unknown> {
  const { data } = await client.get('/vitals/trends', { params: { vital_type: vitalType, days } });
  return data;
}
