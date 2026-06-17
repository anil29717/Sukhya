import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type SectionLabelProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionLabel({ title, actionLabel, onAction }: SectionLabelProps) {
  const { colors } = useLuminaTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
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
  title: { ...LuminaTypography.overline, fontSize: 11 },
  action: { ...LuminaTypography.label, fontWeight: '600' },
});
