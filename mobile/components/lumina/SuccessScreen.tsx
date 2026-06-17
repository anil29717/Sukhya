import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withDelay } from 'react-native-reanimated';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type SuccessScreenProps = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SuccessScreen({ title, message, icon = 'checkmark-circle' }: SuccessScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(100, withSpring(1, { damping: 12 }));
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 80 }]}>
      <Animated.View style={[styles.iconWrap, { backgroundColor: colors.accentMint }, animStyle]}>
        <Ionicons name={icon} size={64} color={colors.accentMintText} />
      </Animated.View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: LuminaSpacing.xxl },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: LuminaSpacing.xxl },
  title: { ...LuminaTypography.h1, textAlign: 'center', marginBottom: LuminaSpacing.md },
  message: { ...LuminaTypography.body, textAlign: 'center' },
});
