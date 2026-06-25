/**
 * Quick action tile — grid (2-col) or carousel (horizontal scroll).
 * Single-layer surface: no nested borders, no Android elevation halo.
 */
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

const { width } = Dimensions.get('window');
const GRID_TILE_WIDTH = (width - LuminaSpacing.xl * 2 - LuminaSpacing.md) / 2;
const CAROUSEL_TILE_WIDTH = 132;

type ActionTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor?: string;
  iconBg?: string;
  onPress?: () => void;
  role?: 'patient' | 'doctor';
  layout?: 'grid' | 'carousel';
  style?: ViewStyle;
};

export function ActionTile({
  icon,
  label,
  iconColor,
  iconBg,
  onPress,
  role = 'patient',
  layout = 'grid',
  style,
}: ActionTileProps) {
  const { colors } = useLuminaTheme({ role });

  const ic = iconColor ?? (role === 'doctor' ? colors.teal : colors.coral);
  const ib = iconBg ?? (role === 'doctor' ? colors.tealSoft : colors.coralSoft);
  const isCarousel = layout === 'carousel';

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress?.(); }}
      style={({ pressed }) => [
        styles.tile,
        isCarousel ? styles.tileCarousel : styles.tileGrid,
        {
          width: isCarousel ? CAROUSEL_TILE_WIDTH : GRID_TILE_WIDTH,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.9 : 1,
        },
        Platform.OS === 'ios' ? LuminaShadow.card : null,
        style,
      ]}
      android_ripple={{ color: `${ic}18` }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, { backgroundColor: ib }]}>
        <Ionicons name={icon} size={isCarousel ? 22 : 24} color={ic} />
      </View>
      <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: LuminaRadius.xl,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  tileGrid: {
    padding: LuminaSpacing.lg,
    gap: LuminaSpacing.md,
    minHeight: 120,
  },
  tileCarousel: {
    padding: LuminaSpacing.md,
    paddingBottom: LuminaSpacing.lg,
    gap: LuminaSpacing.sm,
    minHeight: 108,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmSansMedium,
    lineHeight: 18,
  },
});
