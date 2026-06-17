import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTouch, LuminaTypography } from '@/theme/lumina';
import { AnimatedPressable } from './AnimatedPressable';
import { triggerHaptic } from '@/utils/haptics';

type LuminaButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function LuminaButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
}: LuminaButtonProps) {
  const { colors } = useLuminaTheme();
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.error
        : variant === 'secondary'
          ? colors.secondarySoft
          : variant === 'ghost'
            ? 'transparent'
            : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'secondary'
        ? colors.secondary
        : variant === 'outline' || variant === 'ghost'
          ? colors.text
          : colors.onPrimary;

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
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.border },
        variant === 'primary' && LuminaShadow.sm,
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

type LuminaInputProps = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  hint?: string;
};

export function LuminaInput({ label, icon, hint, style, multiline, ...rest }: LuminaInputProps) {
  const { colors } = useLuminaTheme();
  const isMultiline = multiline || (rest.numberOfLines ?? 0) > 1;

  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          isMultiline && styles.inputWrapMultiline,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.inputIcon} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          multiline={isMultiline}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          style={[
            styles.input,
            isMultiline && styles.inputMultiline,
            { color: colors.text },
            style,
          ]}
          {...rest}
        />
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

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
          borderColor: active ? colors.primary : colors.borderSubtle,
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
      <Text style={[styles.chipText, { color: active ? colors.onPrimary : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { colors } = useLuminaTheme();
  const normalized = status.toLowerCase();
  let bg = colors.primarySoft;
  let fg = colors.primary;
  if (normalized === 'confirmed' || normalized === 'completed' || normalized === 'taken') {
    bg = colors.successSoft;
    fg = colors.successText;
  } else if (normalized === 'cancelled' || normalized === 'missed') {
    bg = colors.errorSoft;
    fg = colors.errorText;
  } else if (normalized === 'pending' || normalized === 'scheduled') {
    bg = colors.warningSoft;
    fg = colors.warningText;
  }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: LuminaTouch.minTarget,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.xl,
  },
  btnSm: { minHeight: 40, paddingHorizontal: LuminaSpacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.sm },
  label: { fontSize: 16, fontWeight: '600' },
  labelSm: { fontSize: 14 },
  inputGroup: { marginBottom: LuminaSpacing.lg },
  inputLabel: { ...LuminaTypography.label, marginBottom: LuminaSpacing.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: LuminaRadius.md,
    minHeight: LuminaTouch.minTarget,
  },
  inputWrapMultiline: { alignItems: 'flex-start', minHeight: 120, paddingVertical: LuminaSpacing.md },
  inputIcon: { paddingLeft: LuminaSpacing.md, paddingTop: LuminaSpacing.md },
  input: { flex: 1, paddingHorizontal: LuminaSpacing.md, fontSize: 16, lineHeight: 22 },
  inputMultiline: { minHeight: 100, paddingTop: LuminaSpacing.sm, paddingBottom: LuminaSpacing.sm },
  hint: { ...LuminaTypography.bodySmall, marginTop: LuminaSpacing.xs },
  chip: {
    paddingHorizontal: LuminaSpacing.lg,
    paddingVertical: LuminaSpacing.sm + 2,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
  },
  chipText: { ...LuminaTypography.label, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: LuminaRadius.sm, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
});
