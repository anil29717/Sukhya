import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';
import { Colors } from '../theme/colors';

export const useTheme = () => {
  const systemScheme = useColorScheme(); // 'light' | 'dark'
  const themeSetting = useSelector((state) => state.settings.theme);

  const isDark =
    themeSetting === 'dark' ||
    (themeSetting === 'system' && systemScheme === 'dark');

  return {
    isDark,
    colors: {
      bg:            isDark ? Colors.darkBg        : Colors.bg,
      surface:       isDark ? Colors.darkSurface   : Colors.surface,
      border:        isDark ? Colors.darkBorder    : Colors.border,
      textPrimary:   isDark ? Colors.darkText      : Colors.textPrimary,
      textSecondary: isDark ? Colors.darkTextSub   : Colors.textSecondary,
      // Brand colors — same in both modes
      teal:          Colors.teal,
      tealLight:     isDark ? '#0D3D30'            : Colors.tealLight,
      tealDark:      Colors.tealDark,
      coral:         Colors.coral,
      coralLight:    isDark ? '#4A1A0D'            : Colors.coralLight,
      // Semantic
      success:       Colors.success,
      successBg:     isDark ? '#0A3320'            : Colors.successBg,
      warning:       Colors.warning,
      warningBg:     isDark ? '#3D2800'            : Colors.warningBg,
      error:         Colors.error,
      errorBg:       isDark ? '#3D0A0A'            : Colors.errorBg,
      info:          Colors.info,
      infoBg:        isDark ? '#0A2840'            : Colors.infoBg,
    },
  };
};