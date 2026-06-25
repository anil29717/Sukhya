/**
 * Time-slot grid for booking screen.
 */
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

const { width } = Dimensions.get('window');
const COLUMNS = 3;
const GUTTER = LuminaSpacing.sm;
const SLOT_WIDTH = (width - LuminaSpacing.xl * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS;

type Slot = {
  start_time: string;
  end_time?: string;
  available?: boolean;
};

type SlotGridProps = {
  slots: Slot[];
  selected: string | null;
  onSelect: (time: string) => void;
  role?: 'patient' | 'doctor';
};

export function SlotGrid({ slots, selected, onSelect, role = 'patient' }: SlotGridProps) {
  const { colors } = useLuminaTheme({ role });
  const activeColor = role === 'doctor' ? colors.teal : colors.coral;

  if (!slots.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No slots available for this date.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = slot.start_time === selected;
        const isUnavailable = slot.available === false;

        return (
          <Pressable
            key={slot.start_time}
            onPress={() => {
              if (isUnavailable) return;
              triggerHaptic('light');
              onSelect(slot.start_time);
            }}
            style={[
              styles.slot,
              {
                width: SLOT_WIDTH,
                backgroundColor: isSelected ? activeColor : colors.surface,
                borderColor: isSelected ? activeColor : colors.border,
                opacity: isUnavailable ? 0.4 : 1,
              },
              isSelected && LuminaShadow.sm,
            ]}
            disabled={isUnavailable}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: isUnavailable }}
          >
            <Text style={[styles.slotTime, { color: isSelected ? '#FFFFFF' : colors.text }]}>
              {formatTime(slot.start_time)}
            </Text>
            {slot.end_time ? (
              <Text style={[styles.slotEnd, { color: isSelected ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
                – {formatTime(slot.end_time)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function formatTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: LuminaSpacing.xl,
    gap: GUTTER,
  },
  slot: {
    paddingVertical: LuminaSpacing.md,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  slotTime: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmMonoMedium,
    letterSpacing: 0.3,
  },
  slotEnd: {
    fontSize: 10,
    fontFamily: LuminaFontFamily.dmMonoRegular,
    marginTop: 2,
  },
  empty: { paddingVertical: LuminaSpacing.xxxl, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: LuminaFontFamily.dmSansRegular },
});
