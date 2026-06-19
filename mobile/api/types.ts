export type UserRole = 'admin' | 'doctor' | 'patient';

export interface RoleResponse {
  id: number;
  name: UserRole;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  profile_photo_url: string | null;
  language_preference: string;
  is_active: boolean;
  is_approved: boolean;
  role: RoleResponse;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  profile_photo_url: string | null;
  language_preference: string;
  role: UserRole;
  created_at: string;
}

export interface PatientResponse {
  id: number;
  user_id: number;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies: string | null;
  medical_history: string | null;
  existing_conditions: string | null;
  created_at: string;
  updated_at: string;
  user: UserResponse;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AppointmentParticipant {
  id: number | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_family_dependent: boolean;
  family_member_id: number | null;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  patient?: AppointmentParticipant;
  doctor?: AppointmentParticipant;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
}

export interface AvailableSlotsResponse {
  doctor_id: number;
  appointment_date: string;
  slot_duration_minutes: number;
  slots: AvailableSlot[];
}

export interface Doctor {
  id: number;
  user_id: number;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  clinic_name?: string | null;
  clinic_address?: string | null;
  bio: string | null;
  consultation_fee: number | null;
  is_available?: boolean;
  full_name?: string;
  email?: string;
  phone?: string | null;
  profile_photo_url?: string | null;
  user?: UserResponse;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  uploaded_by_user_id: number | null;
  appointment_id: number | null;
  record_type: string;
  title: string;
  description: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  download_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
}

export interface Prescription {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id: number | null;
  diagnosis: string | null;
  instructions: string | null;
  status: string;
  medications: PrescriptionItem[];
  doctor_name: string | null;
  patient_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationSchedule {
  id: number;
  time_of_day: string;
  days_of_week: string;
  reminder_enabled: boolean;
}

export interface Medication {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  schedules: MedicationSchedule[];
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: number;
  medication_id: number;
  medication_name: string;
  scheduled_for: string;
  status: string;
  taken_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface MedicationReminder {
  medication_id: number;
  medication_name: string;
  dosage: string | null;
  scheduled_for: string;
  schedule_id: number;
}

export interface VitalSign {
  id: number;
  patient_id: number;
  vital_type: string;
  value: string;
  unit: string | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

export interface TimelineEvent {
  event_type: string;
  reference_id: number;
  title: string;
  summary: string | null;
  event_at: string;
  patient_id: number;
  extra: Record<string, unknown> | null;
}

export interface Notification {
  id: number;
  user_id: number;
  channel: string;
  event_type: string;
  title: string;
  message: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface FamilyMember {
  id: number;
  guardian_patient_id: number;
  full_name: string;
  relationship: string;
  nickname: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string | null;
  chronic_diseases: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  can_share_records: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  dependent?: {
    patient_id: number;
    display_name: string;
    date_of_birth: string | null;
    gender: string | null;
    blood_group: string | null;
    allergies: string | null;
    chronic_diseases: string | null;
  };
}

export interface DigitalLockerSummary {
  patient_id: number;
  total_records: number;
  by_type: Record<string, number>;
  total_downloads: number;
  total_access_events: number;
  shared_with_family: boolean;
}

export interface WaitlistEntry {
  id: number;
  doctor_id: number;
  patient_id: number;
  preferred_date?: string | null;
  desired_date: string;
  reason: string | null;
  status: string;
  doctor_name: string | null;
  created_at: string;
}

export interface AvailabilitySlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface DoctorProfile extends Doctor {
  created_at: string;
  updated_at: string;
  user: UserResponse;
  availability_slots: AvailabilitySlot[];
}

export interface DoctorLeave {
  id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export interface DoctorSchedulingSettings {
  doctor_id: number;
  slot_buffer_minutes: number;
  max_appointments_per_day: number | null;
  slot_duration_minutes: number;
}

export interface DailyAppointmentStat {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface DoctorAnalytics {
  doctor_id: number;
  total_patients: number;
  new_patients_this_month: number;
  appointments_today: number;
  appointments_this_month: number;
  completed_consultations: number;
  cancelled_appointments: number;
  pending_follow_ups: number;
  daily_appointments: DailyAppointmentStat[];
  consultation_completion_rate: number;
}

export interface PatientListItem {
  id: number;
  user_id: number;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface DoctorNote {
  id: number;
  doctor_id: number;
  doctor_name: string | null;
  patient_id: number;
  appointment_id: number | null;
  note_type: string;
  title: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: number;
  doctor_id: number;
  doctor_name: string | null;
  patient_id: number;
  patient_name: string | null;
  source_appointment_id: number | null;
  scheduled_date: string;
  scheduled_time: string | null;
  reason: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PatientHistoryResponse {
  patient_id: number;
  patient_name: string | null;
  timeline: TimelineEvent[];
  appointments: Array<{
    id: number;
    appointment_date: string;
    start_time: string;
    status: string;
    reason: string | null;
  }>;
  medical_records: Array<{ id: number; record_type: string; title: string; created_at: string }>;
  prescriptions: Array<{ id: number; diagnosis: string | null; status: string; created_at: string }>;
  doctor_notes: Array<{
    id: number;
    note_type: string;
    title: string;
    content: string;
    appointment_id: number | null;
    created_at: string;
  }>;
  follow_ups: FollowUp[];
}

export function formatDoctorName(name: string | null | undefined, fallback = 'Physician'): string {
  if (!name?.trim()) return fallback;
  const trimmed = name.trim();
  if (/^dr\.?\s/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
}

export function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function formatTime12(timeStr: string): string {
  const parts = timeStr.split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1]?.slice(0, 2) ?? '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function normalizeUser(raw: UserResponse): UserProfile {
  return {
    id: raw.id,
    email: raw.email,
    full_name: raw.full_name,
    phone: raw.phone,
    profile_photo_url: raw.profile_photo_url,
    language_preference: raw.language_preference,
    role: raw.role.name,
    created_at: raw.created_at,
  };
}
