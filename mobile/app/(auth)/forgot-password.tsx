import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { requestPasswordReset } from '@/api/auth';
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
import { LuminaLayout } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { goBackOrReplace } from '@/utils/navigation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const palette = AUTH_PALETTES.reset;
  const accent = palette.accent;

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const lockScale = useSharedValue(1);
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(16);
  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(20);
  const logoScale = useSharedValue(0.92);

  const ease = Easing.out(Easing.cubic);

  useEffect(() => {
    lockScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2400 }),
        withTiming(1, { duration: 2400 }),
      ),
      -1,
      true,
    );
    logoScale.value = withDelay(40, withTiming(1, { duration: 520, easing: ease }));
    headerOpacity.value = withDelay(80, withTiming(1, { duration: 480, easing: ease }));
    headerY.value = withDelay(80, withTiming(0, { duration: 480, easing: ease }));
    formOpacity.value = withDelay(220, withTiming(1, { duration: 460, easing: ease }));
    formY.value = withDelay(220, withTiming(0, { duration: 460, easing: ease }));
  }, [lockScale, logoScale, headerOpacity, headerY, formOpacity, formY, ease]);

  const mutation = useMutation({
    mutationFn: () => requestPasswordReset(email),
    onSuccess: () => {
      setSent(true);
      setError('');
    },
    onError: () => setError('Could not send reset email. Please try again.'),
  });

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockScale.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    mutation.mutate();
  };

  return (
    <View style={authChromeStyles.root}>
      <AuthBackground palette={palette} />
      <AuthMeshRings accent={accent} topPercent={0.14} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={authChromeStyles.flex}>
        <ScrollView
          contentContainerStyle={[
            authChromeStyles.scroll,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassBackButton onPress={() => goBackOrReplace('/(auth)/login')} />

          <Animated.View style={[authChromeStyles.header, headerStyle]}>
            <AuthLogoMark palette={palette} animatedScale={logoScale} />
            <Animated.View style={[styles.lockBadge, lockStyle]}>
              <View style={[styles.lockRing, { borderColor: `${accent}30` }]}>
                <View style={[styles.lockInner, { backgroundColor: `${accent}18` }]}>
                  <Ionicons name="lock-closed" size={22} color={accent} />
                </View>
              </View>
            </Animated.View>
            <AuthBadge label="Account Recovery" accent={accent} />
            <Text style={authChromeStyles.wordmark}>Lumina Health</Text>
            <Text style={authChromeStyles.heading}>Reset Password</Text>
            <Text style={authChromeStyles.subtitle}>
              Enter your email and we&apos;ll send secure instructions to reset your password.
            </Text>
          </Animated.View>

          <Animated.View style={[LuminaLayout.fullWidth, formStyle]}>
            <GlossyCard accent={accent}>
              {sent ? (
                <View style={authChromeStyles.successBanner}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <Text style={authChromeStyles.successText}>
                    If an account exists for {email}, reset instructions have been sent to your inbox.
                  </Text>
                </View>
              ) : (
                <>
                  {error ? (
                    <View style={authChromeStyles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color={colors.errorText} />
                      <Text style={[authChromeStyles.errorText, { color: colors.errorText }]}>{error}</Text>
                    </View>
                  ) : null}

                  <GlassInput
                    label="Email Address"
                    icon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accent={accent}
                  />

                  <LuminaButton
                    label="Send Reset Link"
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    role="patient"
                  />
                </>
              )}

              <AuthTextLink
                label="Back to Sign In"
                accent={accent}
                onPress={() => router.push('/(auth)/login')}
              />

              <View style={authChromeStyles.secureNote}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#868E96" />
                <Text style={authChromeStyles.secureNoteText}>
                  Reset links expire in 24 hours for your security
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
  lockBadge: {
    position: 'absolute',
    top: 0,
    right: '22%',
  },
  lockRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  lockInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
