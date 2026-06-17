import { useColorScheme } from 'react-native';

import { LuminaColorPalette, LuminaColors, LuminaColorsDark } from './lumina';

export function useLuminaTheme(): { colors: LuminaColorPalette; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? LuminaColorsDark : LuminaColors, isDark };
}
