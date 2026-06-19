import { api, getApiUrl } from './api';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface StorageStats {
  total_files: number;
  total_bytes: number;
  total_mb: number;
  by_record_type: Record<string, number>;
  by_provider: Record<string, number>;
  bytes_by_provider: Record<string, number>;
}

export interface StorageProviderHealth {
  name: string;
  configured: boolean;
  status: string;
  message?: string;
}

export interface StorageHealth {
  storage_backend: string;
  dual_write_s3: boolean;
  cloudinary_configured: boolean;
  s3_configured: boolean;
  providers: StorageProviderHealth[];
}

export interface StorageFileItem {
  id: number;
  patient_id: number;
  patient_name: string | null;
  title: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  record_type: string;
  storage_key: string;
  provider: string;
  download_url: string | null;
  created_at: string;
}

export interface SystemInfo {
  app_version: string;
  storage_backend: string;
  dual_write_s3: boolean;
  db_copy_enabled: boolean;
  database_host_masked: string;
}

export interface DbTableInfo {
  name: string;
  row_count: number;
  copyable: boolean;
}

export interface DbCopyTableResult {
  table: string;
  copied: number;
  skipped: number;
  errors: string[];
}

// Users
export const listUsers = (params?: { role?: string; search?: string; page?: number; page_size?: number }) =>
  api.get<Paginated<unknown>>('/admin/users', { params });

export const createUser = (data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: string;
}) => api.post('/auth/admin/users', data);

export const updateUser = (id: number, data: Record<string, unknown>) =>
  api.put(`/admin/users/${id}`, data);

export const deactivateUser = (id: number) => api.delete(`/admin/users/${id}`);

// Patients
export const listPatients = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/patients', { params });

export const createPatient = (data: Record<string, unknown>) =>
  api.post('/admin/patients', data);

export const updatePatient = (id: number, data: Record<string, unknown>) =>
  api.put(`/admin/patients/${id}`, data);

export const deactivatePatient = (id: number) => api.delete(`/admin/patients/${id}`);

// Doctors
export const listDoctors = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/doctors', { params });

export const updateDoctor = (id: number, data: Record<string, unknown>) =>
  api.put(`/admin/doctors/${id}`, data);

// Appointments
export const listAppointments = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/admin/appointments', { params });

export const rescheduleAppointment = (id: number, data: Record<string, unknown>) =>
  api.post(`/appointments/${id}/reschedule`, data);

export const cancelAppointment = (id: number, reason: string) =>
  api.post(`/appointments/${id}/cancel`, { cancellation_reason: reason });

// Medical records
export const listRecords = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/admin/medical-records', { params });

export const updateRecord = (id: number, data: { title?: string; description?: string }) =>
  api.put(`/admin/medical-records/${id}`, data);

export const deleteRecord = (id: number) => api.delete(`/medical-records/${id}`);

export const uploadRecord = (formData: FormData) =>
  api.post('/medical-records', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const downloadRecordBlob = async (id: number, fileName: string) => {
  const res = await api.get(`/medical-records/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

// Medications
export const listMedications = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/admin/medications', { params });

export const createMedication = (data: Record<string, unknown>) =>
  api.post('/admin/medications', data);

export const updateMedication = (id: number, data: Record<string, unknown>) =>
  api.put(`/admin/medications/${id}`, data);

export const deactivateMedication = (id: number) => api.delete(`/admin/medications/${id}`);

// Follow-ups
export const listFollowUps = (params?: Record<string, unknown>) =>
  api.get<unknown[]>('/follow-ups', { params });

export const createFollowUp = (data: Record<string, unknown>) => api.post('/follow-ups', data);

export const updateFollowUp = (id: number, data: Record<string, unknown>) =>
  api.put(`/follow-ups/${id}`, data);

// Notifications & vitals
export const listNotifications = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/admin/notifications', { params });

export const listVitals = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/admin/vitals', { params });

// Storage & system
export const getStorageStats = () => api.get<StorageStats>('/admin/storage/stats');

export const getStorageHealth = () => api.get<StorageHealth>('/admin/storage/health');

export const listStorageFiles = (params?: Record<string, unknown>) =>
  api.get<Paginated<StorageFileItem>>('/admin/storage/files', { params });

export const getSystemInfo = () => api.get<SystemInfo>('/admin/system/info');

export const downloadStorageFile = async (file: StorageFileItem) => {
  await downloadRecordBlob(file.id, file.file_name);
};

// Database copy
export const testDbConnection = (source_url: string) =>
  api.post<{ ok: boolean; message: string; tables: DbTableInfo[] }>('/admin/database/test-connection', {
    source_url,
  });

export const copyDatabase = (data: { source_url: string; tables: string[]; mode: 'merge' | 'replace' }) =>
  api.post<{ success: boolean; results: DbCopyTableResult[] }>('/admin/database/copy', data);

// Analytics
export const getAnalytics = () => api.get('/admin/analytics');

export const getAuditLogs = (params?: Record<string, unknown>) =>
  api.get<Paginated<unknown>>('/admin/audit-logs', { params });

export const getUsageReport = (days = 30) =>
  api.get('/admin/usage-reports', { params: { days } });

// OpenAPI
export const fetchOpenApi = async () => {
  const base = getApiUrl().replace('/api/v1', '');
  const res = await fetch(`${base}/openapi.json`);
  return res.json();
};
