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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useTheme } from '../../hooks/useTheme';
import { forgotPasswordApi } from '../../api/auth';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

// ─── Geometric lock illustration ─────────────────────────────────
function LockIllustration({ colors }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useState(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  });

  return (
    <View style={illStyles.container}>
      {/* Outer ring */}
      <View style={[illStyles.ringOuter, { borderColor: colors.teal + '18' }]} />
      <View style={[illStyles.ringMid,   { borderColor: colors.teal + '30' }]} />

      {/* Animated inner */}
      <Animated.View style={[illStyles.ringInner, {
        borderColor: colors.teal + '50',
        transform: [{ scale: pulse }],
      }]} />

      {/* Center circle */}
      <View style={[illStyles.center, { backgroundColor: colors.tealLight }]}>
        <Ionicons name="lock-closed" size={32} color={colors.teal} />
      </View>

      {/* Accent dots */}
      <View style={[illStyles.dot1, { backgroundColor: colors.teal + '60' }]} />
      <View style={[illStyles.dot2, { backgroundColor: colors.coral + '50' }]} />
      <View style={[illStyles.dot3, { backgroundColor: colors.teal + '40' }]} />
    </View>
  );
}

const illStyles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: Spacing[8],
  },
  ringOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  ringMid: {
    position: 'absolute',
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 1,
  },
  ringInner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
  },
  center: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot1: { position: 'absolute', width: 9,  height: 9,  borderRadius: 5, top: 18,  right: 28 },
  dot2: { position: 'absolute', width: 6,  height: 6,  borderRadius: 3, bottom: 22, left: 30 },
  dot3: { position: 'absolute', width: 11, height: 11, borderRadius: 6, top: 28,  left: 22 },
});

// ─── Success state ────────────────────────────────────────────────
function SuccessView({ email, resetToken, onResend, resendCooldown, colors }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useState(() => {
    Animated.spring(scaleAnim, {
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
        { backgroundColor: colors.surface, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Check icon */}
      <View style={[styles.successIcon, { backgroundColor: colors.successBg }]}>
        <Ionicons name="checkmark-circle" size={40} color={colors.success} />
      </View>

      <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
        Reset link sent!
      </Text>

      <Text style={[styles.successBody, { color: colors.textSecondary }]}>
        Check your inbox at{' '}
        <Text style={[styles.successEmail, { color: colors.teal }]}>{email}</Text>
        {'. The link expires in 30 minutes.'}
      </Text>

      {__DEV__ && resetToken ? (
        <View style={[styles.devTokenBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[styles.devTokenLabel, { color: colors.textSecondary }]}>
            Dev mode — reset token
          </Text>
          <Text style={[styles.devTokenValue, { color: colors.textPrimary }]} selectable>
            {resetToken}
          </Text>
        </View>
      ) : null}

      {/* Resend */}
      <TouchableOpacity
        onPress={resendCooldown === 0 ? onResend : undefined}
        style={styles.resendBtn}
        activeOpacity={resendCooldown === 0 ? 0.7 : 1}
      >
        {resendCooldown > 0 ? (
          <Text style={[styles.resendCooldown, { color: colors.textSecondary }]}>
            Resend in{' '}
            <Text style={{ fontFamily: FontFamily.dmSansMedium }}>
              {resendCooldown}s
            </Text>
          </Text>
        ) : (
          <Text style={[styles.resendLink, { color: colors.teal }]}>
            Didn't receive it? Resend
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function ForgotPasswordScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [isLoading, setIsLoading]       = useState(false);
  const [apiError, setApiError]         = useState('');
  const [submitted, setSubmitted]       = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const cooldownRef = useRef(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } });

  const [focused, setFocused] = useState(false);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    const email = data.email.trim().toLowerCase();
    try {
      const response = await forgotPasswordApi(email);
      setSubmittedEmail(email);
      setResetToken(response?.reset_token ?? '');
      setSubmitted(true);
      startCooldown();
    } catch (err) {
      if (err.code === 'NETWORK' || err.code === 'TIMEOUT') {
        setApiError(getApiErrorMessage(err));
      } else {
        // Security best practice — don't reveal whether email exists
        setSubmittedEmail(email);
        setResetToken('');
        setSubmitted(true);
        startCooldown();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    setIsLoading(true);
    try {
      await forgotPasswordApi(submittedEmail);
    } catch {}
    setIsLoading(false);
    startCooldown();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {submitted ? (
            // ── Success state ──
            <View style={styles.successContainer}>
              <SuccessView
                email={submittedEmail}
                resetToken={resetToken}
                onResend={onResend}
                resendCooldown={resendCooldown}
                colors={colors}
              />
              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[styles.backToLoginText, { color: colors.textSecondary }]}>
                  Remember your password?{' '}
                </Text>
                <Text style={[styles.backToLoginLink, { color: colors.teal }]}>
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // ── Input state ──
            <View style={{ flex: 1 }}>
              {/* Illustration */}
              <LockIllustration colors={colors} />

              {/* Text */}
              <Text style={[styles.heading, { color: colors.textPrimary }]}>
                Forgot your password?
              </Text>
              <Text style={[styles.subtext, { color: colors.textSecondary }]}>
                Enter your registered email and we'll send you a reset link.
              </Text>

              {/* Error */}
              {apiError ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorBg }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={[styles.errorBannerText, { color: colors.error }]}>
                    {apiError}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setApiError('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Email input */}
              <View style={{ marginTop: Spacing[5] }}>
                <Text style={[styles.inputLabel, { color: colors.textBody }]}>
                  Email address
                </Text>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surface,
                          borderColor: errors.email
                            ? colors.error
                            : focused
                            ? colors.teal
                            : colors.border,
                          borderWidth: focused || errors.email ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={18}
                        color={focused ? colors.teal : colors.textSecondary}
                        style={{ marginRight: Spacing[2] }}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular },
                        ]}
                        placeholder="doctor@hospital.com"
                        placeholderTextColor={colors.textHint}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => { setFocused(false); onBlur(); }}
                        onFocus={() => setFocused(true)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  )}
                />
                {errors.email && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.email.message}
                    </Text>
                  </View>
                )}
              </View>

              {/* Send button */}
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  {
                    backgroundColor: isLoading ? colors.textHint : colors.coral,
                    marginTop: Spacing[6],
                  },
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              {/* Sign in link */}
              <TouchableOpacity
                style={styles.signInRow}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[styles.signInText, { color: colors.textSecondary }]}>
                  Remember your password?{' '}
                </Text>
                <Text style={[styles.signInLink, { color: colors.teal }]}>Sign in</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[8],
  },
  backBtn: {
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Text ──
  heading: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 26,
    lineHeight: 34,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  subtext: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  },

  // ── Error ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing[3],
    borderRadius: Radius.sm,
    marginTop: Spacing[4],
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

  // ── Sign in ──
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[5],
  },
  signInText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  signInLink: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
  },

  // ── Success ──
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing[8],
  },
  successCard: {
    borderRadius: Radius.lg,
    padding: Spacing[6],
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: Spacing[5],
  },
  successEmail: {
    fontFamily: FontFamily.dmSansMedium,
  },
  devTokenBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  devTokenLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    marginBottom: Spacing[1],
  },
  devTokenValue: {
    fontFamily: FontFamily.dmMonoRegular,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  resendBtn: {
    paddingVertical: Spacing[2],
  },
  resendLink: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
  resendCooldown: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  backToLoginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[5],
  },
  backToLoginText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  backToLoginLink: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
  },
});