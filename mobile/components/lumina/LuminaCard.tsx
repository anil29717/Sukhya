import { StyleSheet, View, ViewProps } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';

type LuminaCardProps = ViewProps & {
  children: React.ReactNode;
  elevated?: boolean;
  padded?: 'sm' | 'md' | 'lg';
};

const paddingMap = { sm: LuminaSpacing.md, md: LuminaSpacing.lg, lg: LuminaSpacing.xl };

export function LuminaCard({ children, style, elevated = false, padded = 'md', ...rest }: LuminaCardProps) {
  const { colors, isDark } = useLuminaTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderColor: isDark ? colors.border : 'transparent',
          padding: paddingMap[padded],
        },
        elevated ? LuminaShadow.md : styles.flat,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flat: { borderWidth: 0 },
});
