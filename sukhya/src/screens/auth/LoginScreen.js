import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage, applyValidationErrors } from '../../utils/apiErrors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

// ─── Reusable Input Field ─────────────────────────────────────────
function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightElement,
  colors,
  editable = true,
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.teal
    : colors.border;

  const borderWidth = focused || error ? 1.5 : 1;

  return (
    <View style={{ marginBottom: Spacing[4] }}>
      <Text style={[styles.inputLabel, { color: colors.textBody }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.teal : colors.textSecondary}
            style={styles.inputLeftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: FontFamily.dmSansRegular,
            },
            leftIcon && { paddingLeft: 0 },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textHint}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onFocus={() => setFocused(true)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
        />
        {rightElement}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { login, logout } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [apiError, setApiError]         = useState('');

  // Shake animation for wrong credentials
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      const result = await login(data.email.trim().toLowerCase(), data.password);
      if (result.role !== 'doctor') {
        await logout();
        setApiError('Patient login coming soon. Please use the doctor login.');
      }
      // RootNavigator reacts to Redux state — no manual navigation needed
    } catch (err) {
      if (err.code === 401) {
        shake();
      }
      if (err.code === 422) {
        applyValidationErrors(err.detail, setError);
        setApiError('Please fix the errors below and try again.');
      } else {
        setApiError(getApiErrorMessage(err, {
          401: 'Incorrect email or password. Please try again.',
        }));
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
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            {/* Small logo */}
            <View style={[styles.logoSmall, { backgroundColor: colors.teal }]}>
              <Text style={styles.logoSmallText}>S</Text>
            </View>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>
              Welcome back, Doctor
            </Text>
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              Sign in to your Sukhya account
            </Text>
          </View>

          {/* Form card */}
          <Animated.View
            style={[
              styles.card,
              Shadow.md,
              { backgroundColor: colors.surface, transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {/* API error banner */}
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

            {/* Email */}
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
                <FormInput
                  label="Email address"
                  placeholder="doctor@hospital.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  leftIcon="mail-outline"
                  colors={colors}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
                  leftIcon="lock-closed-outline"
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  }
                  colors={colors}
                />
              )}
            />

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotText, { color: colors.teal }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Sign in button */}
            <TouchableOpacity
              style={[
                styles.btnPrimary,
                { backgroundColor: isLoading ? colors.textHint : colors.coral },
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Register link */}
            <TouchableOpacity
              style={styles.registerRow}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                New doctor?{' '}
              </Text>
              <Text style={[styles.registerLink, { color: colors.teal }]}>
                Register your account
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* DPDPA note */}
          <Text style={[styles.dpdpaNote, { color: colors.textSecondary }]}>
            Your login is secured and audited.{' '}
            <Text style={{ color: colors.teal }}>View Privacy Policy</Text>
          </Text>
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
    paddingBottom: Spacing[8],
  },

  // ── Back ──
  backBtn: {
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header ──
  header: {
    marginBottom: Spacing[6],
  },
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

  // ── Card ──
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },

  // ── Error banner ──
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
    lineHeight: 18,
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
  inputLeftIcon: {
    marginRight: Spacing[2],
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: Spacing[2],
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

  // ── Forgot ──
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -Spacing[2],
    marginBottom: Spacing[5],
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },

  // ── Primary button ──
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

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[4],
    gap: Spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },

  // ── Register link ──
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  registerLink: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
  },

  // ── DPDPA ──
  dpdpaNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});