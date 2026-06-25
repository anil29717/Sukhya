import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  large?: boolean;
  role?: 'patient' | 'doctor';
};

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  rightIcon,
  onRightPress,
  large = false,
  role,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useLuminaTheme({ role });

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + LuminaSpacing.sm, backgroundColor: colors.background },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, LuminaShadow.sm, { backgroundColor: colors.surface }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        <View style={styles.titles}>
          <Text
            style={[large ? styles.titleLarge : styles.title, { color: colors.text }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            style={[styles.iconBtn, LuminaShadow.sm, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
          >
            <Ionicons name={rightIcon} size={18} color={role === 'doctor' ? colors.teal : colors.coral} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: LuminaRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: { width: 40 },
  titles: { flex: 1 },
  title: {
    ...LuminaTypography.h2,
    fontFamily: LuminaFontFamily.nunitoSemiBold,
  },
  titleLarge: {
    ...LuminaTypography.h1,
    fontFamily: LuminaFontFamily.nunitoBold,
  },
  subtitle: { ...LuminaTypography.bodySmall, marginTop: 2 },
});
