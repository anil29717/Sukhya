import { Platform, Vibration } from 'react-native';

export type HapticType = 'light' | 'medium' | 'success' | 'error';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (Platform.OS === 'web') return;
  try {
    const pattern =
      type === 'success' ? [0, 8, 40, 12] : type === 'error' ? [0, 20, 60, 20] : type === 'medium' ? [0, 12] : [0, 4];
    Vibration.vibrate(pattern);
  } catch {
    // no-op
  }
}
