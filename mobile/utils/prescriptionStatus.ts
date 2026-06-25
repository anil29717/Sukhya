import { Ionicons } from '@expo/vector-icons';

export function getPrescriptionStatusStyle(status: string): {
  label: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  const normalized = status.toLowerCase();

  if (normalized === 'shared') {
    return { label: 'Shared', color: '#F79009', bg: '#FEF3C7', icon: 'share-social-outline' };
  }
  if (normalized === 'active' || normalized === 'confirmed') {
    return { label: 'Active', color: '#0D9B76', bg: '#D1FAE5', icon: 'checkmark-circle-outline' };
  }
  if (normalized === 'expired') {
    return { label: 'Expired', color: '#868E96', bg: '#F1F3F5', icon: 'time-outline' };
  }
  if (normalized === 'cancelled') {
    return { label: 'Cancelled', color: '#F04438', bg: '#FEE4E2', icon: 'close-circle-outline' };
  }

  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    color: '#868E96',
    bg: '#F1F3F5',
    icon: 'ellipse-outline',
  };
}
