import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { LuminaButton } from './LuminaButton';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  const { colors } = useLuminaTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.message, { color: colors.errorText }]} accessibilityRole="alert">
        {message}
      </Text>
      {onRetry ? <LuminaButton label="Try Again" onPress={onRetry} variant="outline" size="sm" /> : null}
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { colors } = useLuminaTheme();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
    </View>
  );
}

function SkeletonBlock({ height = 72 }: { height?: number }) {
  const { colors } = useLuminaTheme();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 900 }), -1, true);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.skeleton, animStyle, { height, backgroundColor: colors.borderSubtle }]}
    />
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} height={i === 0 ? 120 : 72} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: LuminaSpacing.md, paddingHorizontal: LuminaSpacing.xl },
  message: { ...LuminaTypography.body, textAlign: 'center' },
  label: { ...LuminaTypography.bodySmall, marginTop: LuminaSpacing.sm },
  skeletonWrap: { padding: LuminaSpacing.lg, gap: LuminaSpacing.md },
  skeleton: { borderRadius: LuminaRadius.lg },
});
