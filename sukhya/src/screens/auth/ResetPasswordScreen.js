import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useTheme } from '../../hooks/useTheme';
import { resetPasswordApi } from '../../api/auth';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

// ─── Password requirement row ─────────────────────────────────────
function Requirement({ met, text, colors }) {
  return (
    <View style={reqStyles.row}>
      <View
        style={[
          reqStyles.dot,
          { backgroundColor: met ? colors.success : colors.border },
        ]}
      >
        {met && <Ionicons name="checkmark" size={9} color="#FFFFFF" />}
      </View>
      <Text
        style={[
          reqStyles.text,
          { color: met ? colors.success : colors.textSecondary },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
});

// ─── Password strength bar ────────────────────────────────────────
function getStrength(password) {
  if (!password) return { score: 0, color: 'transparent', label: '' };
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { score: 1, label: 'Weak',   color: '#F04438' },
    { score: 2, label: 'Fair',   color: '#F79009' },
    { score: 3, label: 'Good',   color: '#0BA5EC' },
    { score: 4, label: 'Strong', color: '#12B76A' },
  ];
  return levels[score - 1] ?? { score: 0, color: 'transparent', label: '' };
}

// ─── Success view ─────────────────────────────────────────────────
function SuccessView({ onGoLogin, colors }) {
  const scale = useRef(new Animated.Value(0)).current;

  useState(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();
  });

  return (
    <Animated.View
      style={[
        styles.successCard,
        Shadow.md,
        { backgroundColor: colors.surface, transform: [{ scale }] },
      ]}
    >
      <View style={[styles.successIcon, { backgroundColor: colors.successBg }]}>
        <Ionicons name="checkmark-circle" size={44} color={colors.success} />
      </View>
      <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
        Password updated!
      </Text>
      <Text style={[styles.successBody, { color: colors.textSecondary }]}>
        Your password has been changed successfully. You can now sign in with your new password.
      </Text>
      <TouchableOpacity
        style={[styles.btnPrimary, { backgroundColor: colors.coral, marginTop: Spacing[5] }]}
        onPress={onGoLogin}
        activeOpacity={0.88}
      >
        <Text style={styles.btnPrimaryText}>Go to Sign In</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function ResetPasswordScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();

  // Token comes from deep link params — for now accept manual entry in dev
  const resetToken = route?.params?.token ?? '';

  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [apiError, setApiError]         = useState('');
  const [success, setSuccess]           = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { new_password: '', confirm_password: '' } });

  const newPassword = watch('new_password') ?? '';
  const confirmPassword = watch('confirm_password') ?? '';

  // Live requirement checks
  const reqs = {
    length:    newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number:    /[0-9]/.test(newPassword),
  };
  const allReqsMet = Object.values(reqs).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const canSubmit = allReqsMet && passwordsMatch;
  const { score, color: strengthColor, label: strengthLabel } = getStrength(newPassword);

  const onSubmit = async (data) => {
    if (!canSubmit) return;
    setIsLoading(true);
    setApiError('');
    try {
      await resetPasswordApi(resetToken, data.new_password);
      setSuccess(true);
    } catch (err) {
      if (err.code === 400) {
        setApiError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setApiError(getApiErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          {!success && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          {success ? (
            // ── Success state ──
            <View style={styles.successContainer}>
              <SuccessView
                onGoLogin={() => navigation.replace('Login')}
                colors={colors}
              />
            </View>
          ) : (
            // ── Form state ──
            <View>
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.logoSmall, { backgroundColor: colors.teal }]}>
                  <Text style={styles.logoSmallText}>S</Text>
                </View>
                <Text style={[styles.heading, { color: colors.textPrimary }]}>
                  Set a new password
                </Text>
                <Text style={[styles.subtext, { color: colors.textSecondary }]}>
                  Make it strong — use uppercase letters and numbers.
                </Text>
              </View>

              {/* Error banner */}
              {apiError ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorBg }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={[styles.errorBannerText, { color: colors.error }]}>
                    {apiError}
                  </Text>
                </View>
              ) : null}

              {/* Form card */}
              <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>

                {/* New password */}
                <Text style={[styles.inputLabel, { color: colors.textBody }]}>
                  New Password
                </Text>
                <Controller
                  control={control}
                  name="new_password"
                  rules={{
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*[0-9])/,
                      message: 'Must include uppercase letter and number',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.bg,
                          borderColor: errors.new_password
                            ? colors.error
                            : focusedField === 'new'
                            ? colors.teal
                            : colors.border,
                          borderWidth: focusedField === 'new' || errors.new_password ? 1.5 : 1,
                          marginBottom: Spacing[2],
                        },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={focusedField === 'new' ? colors.teal : colors.textSecondary}
                        style={{ marginRight: Spacing[2] }}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular },
                        ]}
                        placeholder="Create a strong password"
                        placeholderTextColor={colors.textHint}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => { setFocusedField(null); onBlur(); }}
                        onFocus={() => setFocusedField('new')}
                        secureTextEntry={!showNew}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNew(!showNew)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name={showNew ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3, 4].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthBar,
                            { backgroundColor: i <= score ? strengthColor : colors.border },
                          ]}
                        />
                      ))}
                    </View>
                    {strengthLabel ? (
                      <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                        {strengthLabel}
                      </Text>
                    ) : null}
                  </View>
                )}

                {errors.new_password && (
                  <View style={[styles.errorRow, { marginBottom: Spacing[3] }]}>
                    <Ionicons name="alert-circle" size={13} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.new_password.message}
                    </Text>
                  </View>
                )}

                {/* Requirements checklist */}
                <View
                  style={[
                    styles.reqCard,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.reqTitle, { color: colors.textSecondary }]}>
                    Password requirements
                  </Text>
                  <Requirement met={reqs.length}    text="At least 8 characters"        colors={colors} />
                  <Requirement met={reqs.uppercase} text="One uppercase letter (A–Z)"   colors={colors} />
                  <Requirement met={reqs.number}    text="One number (0–9)"             colors={colors} />
                </View>

                <View style={{ height: Spacing[5] }} />

                {/* Confirm password */}
                <Text style={[styles.inputLabel, { color: colors.textBody }]}>
                  Confirm Password
                </Text>
                <Controller
                  control={control}
                  name="confirm_password"
                  rules={{
                    required: 'Please confirm your password',
                    validate: (val) =>
                      val === getValues('new_password') || 'Passwords do not match',
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.bg,
                          borderColor: errors.confirm_password
                            ? colors.error
                            : focusedField === 'confirm'
                            ? colors.teal
                            : colors.border,
                          borderWidth: focusedField === 'confirm' || errors.confirm_password ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={focusedField === 'confirm' ? colors.teal : colors.textSecondary}
                        style={{ marginRight: Spacing[2] }}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular },
                        ]}
                        placeholder="Re-enter your password"
                        placeholderTextColor={colors.textHint}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => { setFocusedField(null); onBlur(); }}
                        onFocus={() => setFocusedField('confirm')}
                        secureTextEntry={!showConfirm}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirm(!showConfirm)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirm_password && (
                  <View style={[styles.errorRow, { marginTop: Spacing[1] }]}>
                    <Ionicons name="alert-circle" size={13} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.confirm_password.message}
                    </Text>
                  </View>
                )}
              </View>

              {/* Update button */}
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  {
                    backgroundColor:
                      isLoading || !canSubmit ? colors.textHint : colors.coral,
                    marginTop: Spacing[5],
                  },
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading || !canSubmit}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Update Password</Text>
                )}
              </TouchableOpacity>

              {/* Hint below button when requirements not met */}
              {!allReqsMet && newPassword.length > 0 && (
                <Text style={[styles.reqHint, { color: colors.textSecondary }]}>
                  Complete all requirements above to continue
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[10],
  },
  backBtn: {
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header ──
  header: { marginBottom: Spacing[5] },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  logoSmallText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  heading: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 26,
    lineHeight: 34,
    marginBottom: Spacing[1],
  },
  subtext: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // ── Error ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing[3],
    borderRadius: Radius.sm,
    marginBottom: Spacing[4],
  },
  errorBannerText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    flex: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[1],
  },
  errorText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },

  // ── Card ──
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[5],
  },

  // ── Input ──
  inputLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
    marginBottom: Spacing[2],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    height: '100%',
  },

  // ── Strength ──
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    minWidth: 44,
    textAlign: 'right',
  },

  // ── Requirements ──
  reqCard: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing[3],
    marginTop: Spacing[3],
  },
  reqTitle: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    marginBottom: Spacing[2],
    letterSpacing: 0.3,
  },
  reqHint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing[3],
  },

  // ── Button ──
  btnPrimary: {
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.md,
    color: '#FFFFFF',
  },

  // ── Success ──
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing[8],
  },
  successCard: {
    borderRadius: Radius.lg,
    padding: Spacing[6],
    alignItems: 'center',
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  successTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 22,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  successBody: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
    lineHeight: 24,
    textAlign: 'center',
  },
});