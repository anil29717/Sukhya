/**
 * MedicineRow — single medicine entry in create/view prescription.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

export type MedicineEntry = {
  id?: number;
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

type MedicineRowProps = {
  medicine: MedicineEntry;
  index: number;
  onRemove?: (index: number) => void;
  readonly?: boolean;
};

export function MedicineRow({ medicine, index, onRemove, readonly = false }: MedicineRowProps) {
  const { colors } = useLuminaTheme({ role: 'doctor' });

  return (
    <View style={[styles.row, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
      <View style={[styles.indexBadge, { backgroundColor: colors.tealSoft }]}>
        <Text style={[styles.indexText, { color: colors.teal }]}>{index + 1}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{medicine.name}</Text>
        <View style={styles.metaRow}>
          {medicine.dosage ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{medicine.dosage}</Text>
          ) : null}
          {medicine.frequency ? (
            <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
          ) : null}
          {medicine.frequency ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{medicine.frequency}</Text>
          ) : null}
          {medicine.duration ? (
            <>
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{medicine.duration}</Text>
            </>
          ) : null}
        </View>
        {medicine.instructions ? (
          <Text style={[styles.instructions, { color: colors.textMuted }]} numberOfLines={1}>
            {medicine.instructions}
          </Text>
        ) : null}
      </View>

      {!readonly && onRemove ? (
        <Pressable
          onPress={() => { triggerHaptic('light'); onRemove(index); }}
          style={[styles.removeBtn, { backgroundColor: colors.errorSoft }]}
          hitSlop={8}
        >
          <Ionicons name="close" size={14} color={colors.errorText} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: LuminaRadius.md,
    padding: LuminaSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    marginBottom: LuminaSpacing.sm,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexText: { fontSize: 12, fontFamily: LuminaFontFamily.nunitoBold },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontFamily: LuminaFontFamily.dmSansSemiBold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta: { fontSize: 12, fontFamily: LuminaFontFamily.dmSansRegular },
  metaDot: { fontSize: 12 },
  instructions: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansRegular, fontStyle: 'italic' },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
