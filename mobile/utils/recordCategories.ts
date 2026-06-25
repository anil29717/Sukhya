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

/** Visual styling per record type — matches Sukhya patient design system */
export function getRecordTypeStyle(type: string): {
  icon: 'flask-outline' | 'medkit-outline' | 'scan-outline' | 'document-text-outline';
  label: string;
  color: string;
  bg: string;
} {
  const t = type.toLowerCase();
  if (t.includes('prescription')) {
    return { icon: 'medkit-outline', label: 'Prescription', color: '#12B76A', bg: '#DCFCE7' };
  }
  if (t.includes('lab')) {
    return { icon: 'flask-outline', label: 'Lab report', color: '#0BA5EC', bg: '#E0F2FE' };
  }
  if (t.includes('mri')) {
    return { icon: 'scan-outline', label: 'MRI', color: '#F79009', bg: '#FEF3C7' };
  }
  if (t.includes('xray') || t.includes('x-ray')) {
    return { icon: 'scan-outline', label: 'X-Ray', color: '#7C3AED', bg: '#EDE9FE' };
  }
  if (t.includes('ct')) {
    return { icon: 'scan-outline', label: 'CT scan', color: '#F05A2A', bg: '#FEF0EB' };
  }
  if (t.includes('diagnostic')) {
    return { icon: 'document-text-outline', label: 'Diagnostic', color: '#868E96', bg: '#F1F3F5' };
  }
  return { icon: 'document-text-outline', label: type.replace(/_/g, ' '), color: '#868E96', bg: '#F1F3F5' };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
