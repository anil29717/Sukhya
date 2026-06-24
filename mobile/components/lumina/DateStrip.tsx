/**
 * Horizontal scrollable date picker strip.
 * Used in booking flow and schedule screens.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

type DateItem = {
  full: string;    // ISO YYYY-MM-DD
  day: string;     // 'Mon'
  num: number;     // 1–31
  month?: string;  // 'Jan'
};

type DateStripProps = {
  dates: DateItem[];
  selected: string;
  onSelect: (date: string) => void;
  role?: 'patient' | 'doctor';
};

function buildDateItems(count = 14): DateItem[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      full: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
}

export { buildDateItems };

export function DateStrip({ dates, selected, onSelect, role = 'patient' }: DateStripProps) {
  const { colors } = useLuminaTheme({ role });
  const activeColor = role === 'doctor' ? colors.teal : colors.coral;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {dates.map((d) => {
        const isSelected = d.full === selected;
        return (
          <Pressable
            key={d.full}
            onPress={() => { triggerHaptic('light'); onSelect(d.full); }}
            style={[
              styles.dateItem,
              {
                backgroundColor: isSelected ? activeColor : colors.surface,
                borderColor: isSelected ? activeColor : colors.border,
              },
              isSelected && LuminaShadow.sm,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.dayText,
                { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted },
              ]}
            >
              {d.day}
            </Text>
            <Text
              style={[
                styles.numText,
                { color: isSelected ? '#FFFFFF' : colors.text },
              ]}
            >
              {d.num}
            </Text>
            {d.month ? (
              <Text
                style={[
                  styles.monthText,
                  { color: isSelected ? 'rgba(255,255,255,0.70)' : colors.textMuted },
                ]}
              >
                {d.month}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingVertical: LuminaSpacing.md,
    gap: LuminaSpacing.sm,
  },
  dateItem: {
    width: 56,
    paddingVertical: LuminaSpacing.md,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
  },
  dayText: {
    fontSize: 11,
    fontFamily: LuminaFontFamily.dmSansRegular,
  },
  numText: {
    fontSize: 20,
    fontFamily: LuminaFontFamily.nunitoBold,
    lineHeight: 26,
  },
  monthText: {
    fontSize: 10,
    fontFamily: LuminaFontFamily.dmSansRegular,
  },
});
