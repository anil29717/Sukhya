import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useEffect } from 'react';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaMotion, LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

// ─── Segmented / Pill TabBar ───────────────────────────────────────────────────

type TabBarProps<T extends string> = {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
};

export function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  const { colors } = useLuminaTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface }]}>
      <View style={[styles.pillTrack, { backgroundColor: colors.neutral100 }]}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <TabPill
              key={tab.key}
              label={tab.label}
              isActive={isActive}
              onPress={() => {
                triggerHaptic('light');
                onChange(tab.key);
              }}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabPill({
  label,
  isActive,
  onPress,
  colors,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.98, LuminaMotion.spring);
  }, [isActive, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      style={styles.pillPress}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View
        style={[
          styles.pill,
          isActive && { backgroundColor: colors.surfaceElevated, ...LuminaShadow.sm },
          animStyle,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            { color: isActive ? colors.text : colors.textSecondary },
            isActive && styles.pillTextActive,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  onPress?: () => void;
};

export function MetricCard({ icon, label, value, onPress }: MetricCardProps) {
  const { colors } = useLuminaTheme();
  const content = (
    <View style={[metricStyles.card, { backgroundColor: colors.surfaceElevated }, LuminaShadow.sm]}>
      <View style={[metricStyles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[metricStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[metricStyles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={() => { triggerHaptic('light'); onPress(); }} style={{ flex: 1 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

// ─── Stat Card (dashboard floating overlay) ───────────────────────────────────

type StatCardProps = {
  value: string | number;
  label: string;
  valueColor?: string;
};

export function StatCard({ value, label, valueColor }: StatCardProps) {
  const { colors } = useLuminaTheme();
  return (
    <View style={[statStyles.card, LuminaShadow.md, { backgroundColor: colors.surface }]}>
      <Text style={[statStyles.value, { color: valueColor ?? colors.text }]}>{value ?? '—'}</Text>
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: LuminaSpacing.lg, paddingVertical: LuminaSpacing.sm },
  pillTrack: {
    flexDirection: 'row',
    borderRadius: LuminaRadius.md,
    padding: 4,
    gap: 4,
  },
  pillPress: { flex: 1 },
  pill: {
    paddingVertical: LuminaSpacing.sm + 2,
    borderRadius: LuminaRadius.sm + 2,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmSansRegular,
  },
  pillTextActive: {
    fontFamily: LuminaFontFamily.dmSansMedium,
  },
});

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: LuminaRadius.lg,
    padding: LuminaSpacing.lg,
    gap: LuminaSpacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LuminaSpacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: LuminaFontFamily.dmMonoMedium,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: LuminaFontFamily.dmSansRegular,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    height: 88,
    borderRadius: LuminaRadius.md,
    paddingVertical: LuminaSpacing.md,
    paddingHorizontal: LuminaSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 4,
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
