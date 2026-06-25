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
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { login } from '@/api/auth';
import { tokenStorage, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, REMEMBER_ME_KEY } from '@/api/storage';
import { setAuth } from '@/store/authSlice';
import {
  AUTH_PALETTES,
  AuthBackground,
  AuthBadge,
  AuthLogoMark,
  AuthMeshRings,
  AuthTextLink,
  GlassBackButton,
  GlassInput,
  GlossyCard,
  authChromeStyles,
} from '@/components/lumina/AuthChrome';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { LuminaFontFamily, LuminaSpacing, LuminaLayout } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { goBackOrReplace } from '@/utils/navigation';

type AuthLoginScreenProps = {
  role: 'patient' | 'doctor';
};

const ROLE_COPY = {
  patient: {
    heading: 'Welcome back',
    subtitle: 'Sign in to your patient account',
    emailPlaceholder: 'you@example.com',
    badge: 'Patient Portal',
  },
  doctor: {
    heading: 'Welcome back, Doctor',
    subtitle: 'Sign in to your doctor account',
    emailPlaceholder: 'doctor@example.com',
    badge: 'Doctor Portal',
  },
} as const;

export function AuthLoginScreen({ role }: AuthLoginScreenProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role });
  const copy = ROLE_COPY[role];
  const palette = AUTH_PALETTES[role];
  const accent = palette.accent;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(16);
  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(20);
  const shakeX = useSharedValue(0);
  const logoScale = useSharedValue(0.92);

  const ease = Easing.out(Easing.cubic);

  useEffect(() => {
    logoScale.value = withDelay(40, withTiming(1, { duration: 520, easing: ease }));
    headerOpacity.value = withDelay(80, withTiming(1, { duration: 480, easing: ease }));
    headerY.value = withDelay(80, withTiming(0, { duration: 480, easing: ease }));
    formOpacity.value = withDelay(220, withTiming(1, { duration: 460, easing: ease }));
    formY.value = withDelay(220, withTiming(0, { duration: 460, easing: ease }));
  }, [headerOpacity, headerY, formOpacity, formY, logoScale, ease]);

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  };

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: async ({ tokens, user, patient }) => {
      await tokenStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      if (rememberMe) {
        await tokenStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
        await tokenStorage.setItem(REMEMBER_ME_KEY, '1');
      } else {
        await tokenStorage.removeItem(REFRESH_TOKEN_KEY);
        await tokenStorage.setItem(REMEMBER_ME_KEY, '0');
      }
      dispatch(setAuth({ user, token: tokens.access_token, patient }));

      if (role === 'patient') {
        if (user.role === 'patient') {
          router.replace('/(patient)/(tabs)');
        } else if (user.role === 'doctor') {
          router.replace('/(doctor)/(tabs)');
        } else {
          setErrorMsg('Admin portal access is web-only.');
        }
      } else if (user.role === 'doctor') {
        router.replace('/(doctor)/(tabs)');
      } else {
        setErrorMsg('This account is not a doctor account. Please use the patient login.');
        triggerShake();
      }
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Invalid email or password.');
      triggerShake();
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      triggerShake();
      return;
    }
    setErrorMsg('');
    loginMutation.mutate();
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }, { translateX: shakeX.value }],
  }));

  return (
    <View style={authChromeStyles.root}>
      <AuthBackground palette={palette} />
      <AuthMeshRings accent={accent} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={authChromeStyles.flex}>
        <ScrollView
          contentContainerStyle={[
            authChromeStyles.scroll,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassBackButton onPress={() => goBackOrReplace()} />

          <Animated.View style={[authChromeStyles.header, headerStyle]}>
            <AuthLogoMark palette={palette} animatedScale={logoScale} />
            <AuthBadge label={copy.badge} accent={accent} />
            <Text style={authChromeStyles.wordmark}>Lumina Health</Text>
            <Text style={authChromeStyles.heading}>{copy.heading}</Text>
            <Text style={authChromeStyles.subtitle}>{copy.subtitle}</Text>
          </Animated.View>

          <Animated.View style={[LuminaLayout.fullWidth, formStyle]}>
            <GlossyCard accent={accent}>
              {errorMsg ? (
                <View style={authChromeStyles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={colors.errorText} />
                  <Text style={[authChromeStyles.errorText, { color: colors.errorText }]}>{errorMsg}</Text>
                </View>
              ) : null}

              <GlassInput
                label="Email Address"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder={copy.emailPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                accent={accent}
              />

              <GlassInput
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                accent={accent}
                trailing={
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#868E96"
                    />
                  </Pressable>
                }
              />

              <View style={styles.row}>
                <Pressable style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: rememberMe ? accent : 'rgba(255,255,255,0.6)',
                        borderColor: rememberMe ? accent : 'rgba(0,0,0,0.12)',
                      },
                    ]}
                  >
                    {rememberMe ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={[styles.forgotText, { color: accent }]}>Forgot password?</Text>
                </Pressable>
              </View>

              <LuminaButton label="Sign In" onPress={handleLogin} loading={loginMutation.isPending} role={role} />

              <View style={authChromeStyles.secureNote}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#868E96" />
                <Text style={authChromeStyles.secureNoteText}>
                  End-to-end encrypted · HIPAA-ready infrastructure
                </Text>
              </View>
            </GlossyCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  eyeBtn: { padding: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LuminaSpacing.xl,
    marginTop: -4,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: { fontSize: 13, fontFamily: LuminaFontFamily.dmSansRegular, color: '#495057' },
  forgotText: { fontSize: 13, fontFamily: LuminaFontFamily.dmSansSemiBold },
});
