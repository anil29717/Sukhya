import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type SuccessScreenProps = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  role?: 'patient' | 'doctor';
};

export function SuccessScreen({ title, message, icon = 'checkmark-circle', role = 'patient' }: SuccessScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role });
  const scale = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 180 }));
    textOpacity.value = withDelay(350, withTiming(1, { duration: 400 }));
  }, [scale, textOpacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const activeColor = role === 'doctor' ? colors.teal : colors.coral;
  const activeSoft = role === 'doctor' ? colors.tealSoft : colors.coralSoft;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 80 },
      ]}
    >
      <Animated.View
        style={[styles.iconWrap, { backgroundColor: activeSoft }, iconStyle]}
      >
        <Ionicons name={icon} size={64} color={activeColor} />
      </Animated.View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {message ? (
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: LuminaSpacing.xxl },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LuminaSpacing.xxl,
  },
  textBlock: { alignItems: 'center', gap: LuminaSpacing.sm },
  title: {
    ...LuminaTypography.h1,
    fontFamily: LuminaFontFamily.nunitoBold,
    textAlign: 'center',
  },
  message: {
    ...LuminaTypography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
