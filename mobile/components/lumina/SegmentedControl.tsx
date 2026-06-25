/**
 * Segmented control for filtering views (appointments, patient details, etc.)
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

type Segment<T extends string> = {
  key: T;
  label: string;
  badge?: number;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  active: T;
  onChange: (key: T) => void;
  scrollable?: boolean;
  role?: 'patient' | 'doctor';
};

export function SegmentedControl<T extends string>({
  segments,
  active,
  onChange,
  scrollable = false,
  role = 'doctor',
}: SegmentedControlProps<T>) {
  const { colors } = useLuminaTheme({ role });
  const activeColor = role === 'doctor' ? colors.teal : colors.coral;

  const track = (
    <View style={[styles.track, { backgroundColor: colors.neutral100 }]}>
      {segments.map((seg) => {
        const isActive = seg.key === active;
        return (
          <Pressable
            key={seg.key}
            onPress={() => { triggerHaptic('light'); onChange(seg.key); }}
            style={[
              styles.segment,
              isActive && [styles.segmentActive, { backgroundColor: activeColor }],
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? '#FFFFFF' : colors.textSecondary },
                isActive && { fontFamily: LuminaFontFamily.dmSansMedium },
              ]}
            >
              {seg.label}
            </Text>
            {seg.badge != null && seg.badge > 0 ? (
              <View style={[styles.badge, { backgroundColor: isActive ? activeColor : colors.border }]}>
                <Text style={[styles.badgeText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                  {seg.badge > 99 ? '99+' : seg.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {track}
      </ScrollView>
    );
  }
  return <View style={styles.wrapper}>{track}</View>;
}

// ─── Filter Chips ──────────────────────────────────────────────────────────────

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  role?: 'patient' | 'doctor';
};

export function FilterChip({ label, active, onPress, role = 'doctor' }: FilterChipProps) {
  const { colors } = useLuminaTheme({ role });
  const activeColor = role === 'doctor' ? colors.teal : colors.coral;

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress?.(); }}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? activeColor : colors.surface,
          borderColor: active ? activeColor : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: active ? '#FFFFFF' : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: LuminaSpacing.xl, paddingVertical: LuminaSpacing.sm },
  scrollContent: { paddingHorizontal: LuminaSpacing.xl, paddingVertical: LuminaSpacing.sm },
  track: {
    flexDirection: 'row',
    borderRadius: LuminaRadius.lg,
    padding: 4,
    gap: 4,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: LuminaRadius.md,
    gap: 4,
    paddingHorizontal: LuminaSpacing.sm,
    overflow: 'hidden',
  },
  segmentActive: { borderRadius: LuminaRadius.md },
  label: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmSansRegular,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontFamily: LuminaFontFamily.dmSansMedium },

  filterChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmSansRegular,
  },
});
