import { format, formatDistanceToNow, parseISO } from 'date-fns';

// "Tuesday, 5 June 2026"
export const formatFullDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'EEEE, d MMMM yyyy');
  } catch {
    return dateStr;
  }
};

// "5 Jun 2026"
export const formatShortDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
};

// "10:00 AM"
export const formatTime = (timeStr) => {
  try {
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(h), parseInt(m));
    return format(date, 'hh:mm aa');
  } catch {
    return timeStr;
  }
};

// "2 days ago"
export const formatRelative = (dateStr) => {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

// "₹500"
export const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

// "+91 98765 43210" from "9876543210"
export const formatPhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
};

// Status label with capital
export const formatStatus = (status) => {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Appointment or list item with nested patient object
export const getPatientDisplayName = (item, fallback = 'Patient') =>
  item?.patient?.full_name ?? item?.patient_name ?? fallback;