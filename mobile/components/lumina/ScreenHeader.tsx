import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaSpacing, LuminaTouch, LuminaTypography } from '@/theme/lumina';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  large?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  rightIcon,
  onRightPress,
  large = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useLuminaTheme();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + LuminaSpacing.sm, backgroundColor: colors.background }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
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
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Action"
          >
            <Ionicons name={rightIcon} size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: LuminaSpacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.sm },
  iconBtn: {
    width: LuminaTouch.minTarget,
    height: LuminaTouch.minTarget,
    borderRadius: LuminaTouch.minTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: { width: LuminaTouch.minTarget },
  titles: { flex: 1 },
  title: { ...LuminaTypography.h2 },
  titleLarge: { ...LuminaTypography.display, fontSize: 28 },
  subtitle: { ...LuminaTypography.bodySmall, marginTop: 2 },
});
