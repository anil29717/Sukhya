import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import {
  LuminaButtonHeight,
  LuminaFontFamily,
  LuminaInputHeight,
  LuminaRadius,
  LuminaShadow,
  LuminaSpacing,
  LuminaTypography,
  LuminaLayout,
} from '@/theme/lumina';
import { AnimatedPressable } from './AnimatedPressable';
import { triggerHaptic } from '@/utils/haptics';

// ─── Button ────────────────────────────────────────────────────────────────────

type LuminaButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  role?: 'patient' | 'doctor';
};

export function LuminaButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  role,
}: LuminaButtonProps) {
  const { colors } = useLuminaTheme({ role });

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.error
        : variant === 'secondary'
          ? colors.primarySoft
          : 'transparent';

  const fg =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'secondary'
        ? colors.primary
        : colors.text;

  const glowShadow =
    variant === 'primary' && !disabled && !loading
      ? Platform.select({
          ios: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.28,
            shadowRadius: 12,
          },
          android: { elevation: 6 },
          default: {},
        })
      : undefined;

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  return (
    <AnimatedPressable
      style={[
        styles.btn,
        size === 'sm' && styles.btnSm,
        { backgroundColor: bg, opacity: disabled || loading ? 0.55 : 1 },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.primary },
        variant === 'secondary' && LuminaShadow.sm,
        glowShadow,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: fg }]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────

type LuminaInputProps = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  hint?: string;
  error?: string;
};

export function LuminaInput({ label, icon, hint, error, style, multiline, ...rest }: LuminaInputProps) {
  const { colors } = useLuminaTheme();
  const [focused, setFocused] = useState(false);
  const isMultiline = multiline || (rest.numberOfLines ?? 0) > 1;

  const borderColor = error ? colors.error : focused ? colors.teal : colors.border;
  const borderWidth = focused || error ? 1.5 : 1;

  return (
    <View style={styles.inputGroup}>
      {label ? (
        <Text style={[styles.inputLabel, { color: colors.textBody }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          isMultiline && styles.inputWrapMultiline,
          { borderColor, borderWidth, backgroundColor: colors.surface },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.teal : colors.textSecondary}
            style={styles.inputIcon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textHint}
          multiline={isMultiline}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          style={[
            styles.input,
            isMultiline && styles.inputMultiline,
            { color: colors.text, fontFamily: LuminaFontFamily.dmSansRegular },
            style,
          ]}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

// ─── Chip ──────────────────────────────────────────────────────────────────────

type LuminaChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function LuminaChip({ label, active, onPress }: LuminaChipProps) {
  const { colors } = useLuminaTheme();
  return (
    <Pressable
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
        active && LuminaShadow.sm,
      ]}
      onPress={() => {
        triggerHaptic('light');
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, { color: active ? colors.onPrimary : colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const { colors } = useLuminaTheme();
  const normalized = status.toLowerCase();
  let bg = colors.statusPendingBg;
  let fg = colors.statusPending;

  if (normalized === 'confirmed') {
    bg = colors.statusConfirmedBg; fg = colors.statusConfirmed;
  } else if (normalized === 'completed' || normalized === 'taken') {
    bg = colors.statusCompletedBg; fg = colors.statusCompleted;
  } else if (normalized === 'cancelled' || normalized === 'missed') {
    bg = colors.statusCancelledBg; fg = colors.statusCancelled;
  } else if (normalized === 'scheduled') {
    bg = colors.statusConfirmedBg; fg = colors.statusConfirmed;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, flexShrink: 0 }]}>
      <Text style={[styles.badgeText, { color: fg, fontFamily: LuminaFontFamily.dmSansSemiBold }]} numberOfLines={1}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    height: LuminaButtonHeight,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.xl,
    ...LuminaLayout.fullWidth,
  },
  btnSm: { height: 40, paddingHorizontal: LuminaSpacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.sm },
  label: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    letterSpacing: 0.1,
  },
  labelSm: { fontSize: 14 },

  // Input
  inputGroup: { marginBottom: LuminaSpacing.lg, ...LuminaLayout.fullWidth },
  inputLabel: { ...LuminaTypography.label, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LuminaRadius.md,
    minHeight: LuminaInputHeight,
    ...LuminaLayout.fullWidth,
  },
  inputWrapMultiline: {
    alignItems: 'flex-start',
    minHeight: 88,
    paddingVertical: LuminaSpacing.md,
    backgroundColor: undefined,
  },
  inputIcon: { paddingLeft: LuminaSpacing.md, paddingTop: 2 },
  input: { flex: 1, paddingHorizontal: LuminaSpacing.md, fontSize: 15, lineHeight: 22 },
  inputMultiline: { minHeight: 80, paddingTop: LuminaSpacing.sm, paddingBottom: LuminaSpacing.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansRegular },
  hint: { ...LuminaTypography.bodySmall, marginTop: 4 },

  // Chip
  chip: {
    paddingHorizontal: LuminaSpacing.lg,
    paddingVertical: 8,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
  },
  chipText: { ...LuminaTypography.label, fontWeight: '600' },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, letterSpacing: 0.5 },
});
