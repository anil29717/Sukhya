import { Alert, Linking, Platform } from 'react-native';

/**
 * Normalize a display phone string for tel: URLs.
 * e.g. "+1-555-0142" → "+15550142"
 */
export function normalizePhoneForDialer(phone: string): string | null {
  const trimmed = phone?.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  return hasPlus ? `+${digits}` : digits;
}

export function toTelUrl(phone: string): string | null {
  const normalized = normalizePhoneForDialer(phone);
  return normalized ? `tel:${normalized}` : null;
}

/**
 * Open the device phone dialer with the given number.
 * Strips hyphens/spaces so tel: URLs work on iOS and Android.
 */
export async function openPhoneDialer(phone: string): Promise<boolean> {
  const url = toTelUrl(phone);
  if (!url) {
    Alert.alert('Invalid number', 'This phone number cannot be dialed.');
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      showDialerUnavailableAlert(phone.trim());
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch {
    showDialerUnavailableAlert(phone.trim());
    return false;
  }
}

function showDialerUnavailableAlert(displayNumber: string) {
  const simulatorHint =
    Platform.OS === 'ios' || Platform.OS === 'android'
      ? ' Phone calls are not available in the simulator — use a physical device to call.'
      : '';

  Alert.alert(
    'Unable to call',
    `Could not open the phone dialer for ${displayNumber}.${simulatorHint}`,
  );
}
