import { apiJson } from './client';

export function getDoctorSlots(doctorId, appointmentDate) {
  return apiJson(`/appointments/doctors/${doctorId}/slots?appointment_date=${appointmentDate}`);
}

export function bookAppointment(payload) {
  return apiJson('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getUpcomingAppointments(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/appointments/upcoming${query ? `?${query}` : ''}`);
}

export function getCompletedAppointments(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/appointments/completed${query ? `?${query}` : ''}`);
}

export function getAppointmentHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiJson(`/appointments/history${query ? `?${query}` : ''}`);
}

export function getTodayAppointments() {
  return apiJson('/appointments/today');
}

export function getAppointment(appointmentId) {
  return apiJson(`/appointments/${appointmentId}`);
}

export function confirmAppointment(appointmentId) {
  return apiJson(`/appointments/${appointmentId}/confirm`, { method: 'POST' });
}

export function rescheduleAppointment(appointmentId, payload) {
  return apiJson(`/appointments/${appointmentId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelAppointment(appointmentId, payload = {}) {
  return apiJson(`/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function completeAppointment(appointmentId, payload = {}) {
  return apiJson(`/appointments/${appointmentId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
