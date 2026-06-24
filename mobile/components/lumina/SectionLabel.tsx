import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaSpacing } from '@/theme/lumina';

type SectionLabelProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionLabel({ title, actionLabel, onAction, role }: SectionLabelProps & { role?: 'patient' | 'doctor' }) {
  const { colors } = useLuminaTheme({ role });
  const labelColor = role === 'patient' ? colors.coral : colors.teal;
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: labelColor }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: colors.teal }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LuminaSpacing.md,
    marginTop: LuminaSpacing.sm,
  },
  title: {
    fontSize: 11,
    fontFamily: LuminaFontFamily.dmSansMedium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  action: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmSansMedium,
  },
});
