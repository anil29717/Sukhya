/**
 * Premium month calendar for health timeline — event dots, day selection.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from '@/components/lumina/BottomSheet';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: string, b: string) {
  return a === b;
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset
  const startOffset = (first.getDay() + 6) % 7;
  const cells: Array<{ iso: string; day: number } | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIsoDate(new Date(year, month, d)), day: d });
  }
  return cells;
}

type HealthCalendarProps = {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  /** ISO dates (YYYY-MM-DD) that have at least one event */
  eventDates?: Set<string>;
  onMonthChange?: (year: number, month: number) => void;
  /** When true, renders without outer card chrome (for bottom sheets) */
  embedded?: boolean;
  /** Called after a day is tapped — use to close parent sheet */
  onDaySelected?: () => void;
  role?: 'patient' | 'doctor';
};

export function HealthCalendar({
  selectedDate,
  onSelectDate,
  eventDates,
  onMonthChange,
  embedded = false,
  onDaySelected,
  role = 'patient',
}: HealthCalendarProps) {
  const { colors } = useLuminaTheme({ role });
  const accent = role === 'doctor' ? colors.teal : colors.coral;
  const selected = parseIso(selectedDate);
  const todayIso = toIsoDate(new Date());

  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(viewYear);
  const [pickerMonth, setPickerMonth] = useState(viewMonth);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  useEffect(() => {
    onMonthChange?.(viewYear, viewMonth);
  }, [viewYear, viewMonth, onMonthChange]);

  useEffect(() => {
    const d = parseIso(selectedDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  const goMonth = (delta: number) => {
    triggerHaptic('light');
    const d = new Date(viewYear, viewMonth + delta, 1);
    const newYear = d.getFullYear();
    const newMonth = d.getMonth();
    setViewYear(newYear);
    setViewMonth(newMonth);
    const sel = parseIso(selectedDate);
    const day = Math.min(sel.getDate(), new Date(newYear, newMonth + 1, 0).getDate());
    onSelectDate(toIsoDate(new Date(newYear, newMonth, day)));
  };

  const openPicker = () => {
    triggerHaptic('light');
    setPickerYear(viewYear);
    setPickerMonth(viewMonth);
    setShowPicker(true);
  };

  const applyPicker = () => {
    triggerHaptic('medium');
    setViewYear(pickerYear);
    setViewMonth(pickerMonth);
    const day = Math.min(selected.getDate(), new Date(pickerYear, pickerMonth + 1, 0).getDate());
    onSelectDate(toIsoDate(new Date(pickerYear, pickerMonth, day)));
    setShowPicker(false);
  };

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => current - 5 + i);
  }, []);

  const handleSelectDay = (iso: string) => {
    triggerHaptic('light');
    onSelectDate(iso);
    onDaySelected?.();
  };

  return (
    <View style={embedded ? styles.embeddedWrap : [styles.wrap, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
      {/* Month navigation */}
      <View style={styles.navRow}>
        <Pressable onPress={() => goMonth(-1)} style={styles.navBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={openPicker} style={styles.monthTitleBtn}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>
        <Pressable onPress={() => goMonth(1)} style={styles.navBtn} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.weekLabel, { color: colors.textMuted }]}>
            {w}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((cell, idx) => {
          if (!cell) {
            return <View key={`empty-${idx}`} style={styles.cell} />;
          }
          const isSelected = isSameDay(cell.iso, selectedDate);
          const isToday = isSameDay(cell.iso, todayIso);
          const hasEvents = eventDates?.has(cell.iso);

          return (
            <Pressable
              key={cell.iso}
              onPress={() => handleSelectDay(cell.iso)}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${cell.day} ${MONTHS[viewMonth]}`}
            >
              <View
                style={[
                  styles.dayInner,
                  isSelected && { backgroundColor: accent },
                  !isSelected && isToday && { borderWidth: 1.5, borderColor: accent },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: isSelected ? '#FFFFFF' : isToday ? accent : colors.text,
                      fontFamily: isSelected || isToday
                        ? LuminaFontFamily.dmSansMedium
                        : LuminaFontFamily.dmSansRegular,
                    },
                  ]}
                >
                  {cell.day}
                </Text>
              </View>
              {hasEvents ? (
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: isSelected ? '#FFFFFF' : accent },
                  ]}
                />
              ) : (
                <View style={styles.eventDotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Month / year picker */}
      <BottomSheet visible={showPicker} onClose={() => setShowPicker(false)} height={420}>
        <View style={styles.pickerHeader}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>Jump to date</Text>
          <Pressable onPress={() => setShowPicker(false)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.pickerSection, { color: colors.textMuted }]}>YEAR</Text>
        <View style={styles.yearRow}>
          {yearOptions.map((y) => (
            <Pressable
              key={y}
              onPress={() => setPickerYear(y)}
              style={[
                styles.yearChip,
                {
                  backgroundColor: pickerYear === y ? accent : colors.neutral100,
                  borderColor: pickerYear === y ? accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.yearChipText,
                  { color: pickerYear === y ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {y}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.pickerSection, { color: colors.textMuted }]}>MONTH</Text>
        <View style={styles.monthGrid}>
          {MONTHS.map((m, i) => (
            <Pressable
              key={m}
              onPress={() => setPickerMonth(i)}
              style={[
                styles.monthChip,
                {
                  backgroundColor: pickerMonth === i ? accent : colors.neutral100,
                  borderColor: pickerMonth === i ? accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.monthChipText,
                  { color: pickerMonth === i ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {m.slice(0, 3)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={applyPicker}
          style={[styles.applyBtn, { backgroundColor: accent }]}
        >
          <Text style={styles.applyBtnText}>Go to {MONTHS[pickerMonth]} {pickerYear}</Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

export { toIsoDate };

const styles = StyleSheet.create({
  wrap: {
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.lg,
  },
  embeddedWrap: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: LuminaSpacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontFamily: LuminaFontFamily.nunitoSemiBold,
    fontSize: 17,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 14 },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  eventDotPlaceholder: { height: 7 },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.sm,
  },
  pickerTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20 },
  pickerSection: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    paddingHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.sm,
    marginTop: LuminaSpacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.md,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
  },
  yearChipText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.lg,
  },
  monthChip: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: LuminaRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthChipText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 },
  applyBtn: {
    marginHorizontal: LuminaSpacing.xl,
    height: 48,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
