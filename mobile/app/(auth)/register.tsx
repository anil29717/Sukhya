import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { client } from '@/api/client';
import { LuminaFontFamily, LuminaRadius, LuminaSpacing, LuminaTypography, LuminaLayout } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { PasswordStrengthBar } from '@/components/lumina/PasswordStrengthBar';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(10);
  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(10);

  const ease = Easing.out(Easing.cubic);

  useEffect(() => {
    headerOpacity.value = withDelay(60, withTiming(1, { duration: 420, easing: ease }));
    headerY.value = withDelay(60, withTiming(0, { duration: 420, easing: ease }));
    formOpacity.value = withDelay(180, withTiming(1, { duration: 400, easing: ease }));
    formY.value = withDelay(180, withTiming(0, { duration: 400, easing: ease }));
  }, [headerOpacity, headerY, formOpacity, formY, ease]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      const response = await client.post('/auth/register/patient', {
        email,
        password,
        full_name: fullName,
        phone: phone || null,
        language_preference: 'en',
      });
      return response.data;
    },
    onSuccess: async () => {
      setSuccess(true);
      try {
        const { login } = await import('@/api/auth');
        const { tokens, user, patient } = await login(email, password);
        const { tokenStorage, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = await import('@/api/storage');
        const { setAuth } = await import('@/store/authSlice');
        const { store } = await import('@/store/store');
        await tokenStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        await tokenStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
        store.dispatch(setAuth({ user, token: tokens.access_token, patient }));
        setTimeout(() => router.replace('/(patient)/(tabs)'), 1500);
      } catch {
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Registration failed. Check your inputs.');
    },
  });

  const handleRegister = () => {
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    registerMutation.mutate();
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={[styles.logoMark, { backgroundColor: colors.coralSoft }]}>
            <Text style={[styles.logoLetter, { color: colors.coral }]}>L</Text>
          </View>
          <Text style={[styles.wordmark, { color: colors.text }]}>Lumina Health</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create a patient account</Text>
        </Animated.View>

        {/* Form card */}
        <Animated.View
          style={[styles.form, LuminaLayout.fullWidth, formStyle, { backgroundColor: colors.surface }]}
        >
          {success ? (
            <View style={[styles.successBanner, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.successText, { color: colors.successText }]}>
                Account created! Signing you in…
              </Text>
            </View>
          ) : (
            <>
              {errorMsg ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorSoft }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.errorText} />
                  <Text style={[styles.errorText, { color: colors.errorText }]}>{errorMsg}</Text>
                </View>
              ) : null}

              <LuminaInput
                label="Full Name"
                icon="person-outline"
                placeholder="Jane Doe"
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
              />

              <LuminaInput
                label="Email Address"
                icon="mail-outline"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <LuminaInput
                label="Phone Number (optional)"
                icon="call-outline"
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <View>
                <LuminaInput
                  label="Password"
                  icon="lock-closed-outline"
                  placeholder="Min 8 characters"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable style={styles.eyeToggle} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
                {password.length > 0 ? (
                  <PasswordStrengthBar password={password} />
                ) : null}
              </View>

              <LuminaButton
                label="Create Account"
                onPress={handleRegister}
                loading={registerMutation.isPending}
                role="patient"
              />
            </>
          )}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[styles.loginLink, { color: colors.coral }]}>Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: LuminaSpacing.xl,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: { fontSize: 26, fontFamily: LuminaFontFamily.nunitoExtraBold },
  wordmark: {
    fontSize: 24,
    fontFamily: LuminaFontFamily.nunitoExtraBold,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: { ...LuminaTypography.body },

  form: {
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '100%',
    alignSelf: 'stretch',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.xs,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.md,
    marginBottom: LuminaSpacing.lg,
  },
  errorText: { ...LuminaTypography.bodySmall, flex: 1 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.sm,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.md,
  },
  successText: {
    ...LuminaTypography.bodySmall,
    fontFamily: LuminaFontFamily.dmSansMedium,
    flex: 1,
  },

  eyeToggle: {
    position: 'absolute',
    right: 14,
    bottom: LuminaSpacing.lg + 14,
    height: 24,
    justifyContent: 'center',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: { ...LuminaTypography.bodySmall },
  loginLink: {
    ...LuminaTypography.bodySmall,
    fontFamily: LuminaFontFamily.dmSansSemiBold,
  },
});
