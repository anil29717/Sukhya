import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { LuminaButton } from './LuminaButton';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  role?: 'patient' | 'doctor';
};

export function EmptyState({ icon, title, message, actionLabel, onAction, role }: EmptyStateProps) {
  const { colors } = useLuminaTheme({ role });
  const accentColor = role === 'doctor' ? colors.teal : role === 'patient' ? colors.coral : colors.primary;
  const accentSoft = role === 'doctor' ? colors.tealSoft : role === 'patient' ? colors.coralSoft : colors.primarySoft;

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
        <Ionicons name={icon} size={36} color={accentColor} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.btnWrap}>
          <LuminaButton label={actionLabel} onPress={onAction} size="sm" role={role} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: LuminaSpacing.xxl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LuminaSpacing.lg,
  },
  title: {
    ...LuminaTypography.h2,
    fontFamily: LuminaFontFamily.nunitoBold,
    textAlign: 'center',
    marginBottom: LuminaSpacing.sm,
  },
  message: {
    ...LuminaTypography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnWrap: { marginTop: LuminaSpacing.xl, minWidth: 160 },
});
