import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaMotion, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

export type DoctorTabKey = 'dashboard' | 'appointments' | 'patients' | 'schedule' | 'profile';

type TabItem = {
  key: DoctorTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
  { key: 'appointments', label: 'Appts', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'patients', label: 'Patients', icon: 'people-outline', iconActive: 'people' },
  { key: 'schedule', label: 'Schedule', icon: 'time-outline', iconActive: 'time' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

type DoctorBottomNavProps = {
  active: DoctorTabKey;
  onTabPress: (tab: DoctorTabKey) => void;
};

function TabButton({ tab, isActive, onPress }: { tab: TabItem; isActive: boolean; onPress: () => void }) {
  const { colors } = useLuminaTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, LuminaMotion.springSnappy);
  }, [isActive, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      style={styles.tab}
      onPress={() => {
        triggerHaptic('light');
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={animStyle}>
        {isActive ? (
          <View style={[styles.activeIconWrap, { backgroundColor: colors.primary }]}>
            <Ionicons name={tab.iconActive} size={20} color={colors.onPrimary} />
          </View>
        ) : (
          <Ionicons name={tab.icon} size={24} color={colors.textMuted} />
        )}
      </Animated.View>
      <Text style={[styles.label, { color: isActive ? colors.primary : colors.textMuted }, isActive && styles.labelActive]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

export function DoctorBottomNav({ active, onTabPress }: DoctorBottomNavProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();

  return (
    <View
      style={[
        styles.wrapper,
        LuminaShadow.nav,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.bar}>
        {TABS.map((tab) => (
          <TabButton key={tab.key} tab={tab} isActive={tab.key === active} onPress={() => onTabPress(tab.key)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderTopWidth: StyleSheet.hairlineWidth },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: LuminaSpacing.sm, paddingHorizontal: LuminaSpacing.xs },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 52, justifyContent: 'center' },
  activeIconWrap: { width: 40, height: 40, borderRadius: LuminaRadius.full, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
});
