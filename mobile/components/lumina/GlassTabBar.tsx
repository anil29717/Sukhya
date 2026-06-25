import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

export type GlassTabItem<T extends string> = {
  key: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

type GlassTabBarProps<T extends string> = {
  tabs: GlassTabItem<T>[];
  active: T;
  onTabPress: (key: T) => void;
  role: 'patient' | 'doctor';
};

export function GlassTabBar<T extends string>({
  tabs,
  active,
  onTabPress,
  role,
}: GlassTabBarProps<T>) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useLuminaTheme({ role });
  const activeColor = role === 'doctor' ? colors.teal : colors.coral;

  const blurTint = isDark ? 'dark' : 'light';
  const pillBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)';
  const activePillBg = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)';
  const glassTint = isDark ? 'rgba(30,32,40,0.55)' : 'rgba(255,255,255,0.55)';

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.shadowWrap}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 68 : 88}
          tint={blurTint}
          style={[styles.pill, { borderColor: pillBorder, backgroundColor: glassTint }]}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        >
          <View style={styles.bar}>
            {tabs.map((tab) => {
              const isActive = tab.key === active;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, isActive && { backgroundColor: activePillBg }]}
                  onPress={() => {
                    triggerHaptic('light');
                    onTabPress(tab.key);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.icon}
                    size={20}
                    color={isActive ? activeColor : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.label,
                      { color: isActive ? activeColor : colors.textSecondary },
                      isActive && styles.labelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: LuminaSpacing.lg,
    zIndex: 100,
  },
  shadowWrap: {
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  pill: {
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 62,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 9999,
    minHeight: 50,
  },
  label: {
    fontSize: 10,
    fontFamily: LuminaFontFamily.dmSansRegular,
    letterSpacing: 0.1,
  },
  labelActive: {
    fontFamily: LuminaFontFamily.dmSansMedium,
  },
});
