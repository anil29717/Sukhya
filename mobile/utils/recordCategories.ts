import { MedicalRecord } from '@/api/types';

/** UI category keys → backend record_type values (client-side filter when needed). */
export const RECORD_CATEGORY_MAP: Record<string, string[] | 'all' | 'reports'> = {
  all: 'all',
  reports: 'reports',
  prescription: ['prescription'],
  xray: ['diagnostic_report', 'xray'],
  mri: ['diagnostic_report', 'mri'],
  ctscan: ['diagnostic_report', 'ctscan'],
  lab_report: ['lab_report'],
  diagnostic_report: ['diagnostic_report'],
};

export function filterRecordsByCategory(records: MedicalRecord[], category: string): MedicalRecord[] {
  const mapping = RECORD_CATEGORY_MAP[category] ?? 'all';
  if (mapping === 'all') return records;
  if (mapping === 'reports') {
    return records.filter((r) => r.record_type === 'lab_report' || r.record_type === 'diagnostic_report');
  }
  return records.filter((r) => mapping.includes(r.record_type));
}

export function apiRecordTypeForCategory(category: string): string | undefined {
  if (category === 'all' || category === 'reports') return undefined;
  if (category === 'prescription') return 'prescription';
  if (category === 'lab_report') return 'lab_report';
  if (['xray', 'mri', 'ctscan'].includes(category)) return 'diagnostic_report';
  return category;
}
