import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LuminaFontFamily, LuminaRadius, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

type SheetOptionRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  role?: 'patient' | 'doctor';
};

export function SheetOptionRow({
  icon,
  label,
  subtitle,
  selected,
  onPress,
  role = 'doctor',
}: SheetOptionRowProps) {
  const { colors } = useLuminaTheme({ role });
  const accent = role === 'doctor' ? colors.teal : colors.coral;

  return (
    <Pressable
      onPress={() => {
        triggerHaptic('light');
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? colors.tealSoft : pressed ? colors.neutral100 : 'transparent',
          borderColor: selected ? accent : colors.border,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: selected ? accent + '22' : colors.neutral100 }]}>
          <Ionicons name={icon} size={18} color={selected ? accent : colors.textSecondary} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={accent} />
      ) : (
        <View style={[styles.radio, { borderColor: colors.border }]} />
      )}
    </Pressable>
  );
}

export function SheetSectionLabel({ label }: { label: string }) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    paddingVertical: 14,
    paddingHorizontal: LuminaSpacing.md,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  label: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  subtitle: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: LuminaSpacing.sm,
    marginTop: LuminaSpacing.sm,
  },
});
