import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { LuminaButton } from './LuminaButton';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useLuminaTheme();

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.btnWrap}>
          <LuminaButton label={actionLabel} onPress={onAction} size="sm" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, paddingHorizontal: LuminaSpacing.xxl },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: LuminaSpacing.lg },
  title: { ...LuminaTypography.h2, textAlign: 'center', marginBottom: LuminaSpacing.sm },
  message: { ...LuminaTypography.body, textAlign: 'center', lineHeight: 22 },
  btnWrap: { marginTop: LuminaSpacing.xl, minWidth: 160 },
});
