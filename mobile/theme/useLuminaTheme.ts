import { useColorScheme } from 'react-native';

import {
  LuminaColorPalette,
  LuminaColors,
  LuminaColorsDark,
  LuminaColorsDoctorLight,
  LuminaColorsDoctorDark,
} from './lumina';

export type LuminaRole = 'patient' | 'doctor';

export function useLuminaTheme(opts?: { role?: LuminaRole }): {
  colors: LuminaColorPalette;
  isDark: boolean;
  role: LuminaRole;
} {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const role = opts?.role ?? 'patient';

  const base = isDark ? LuminaColorsDark : LuminaColors;
  const roleOverrides = role === 'doctor'
    ? (isDark ? LuminaColorsDoctorDark : LuminaColorsDoctorLight)
    : {};

  return {
    colors: { ...base, ...roleOverrides } as LuminaColorPalette,
    isDark,
    role,
  };
}
