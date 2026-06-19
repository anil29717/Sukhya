import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { login } from '@/api/auth';
import { tokenStorage, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, REMEMBER_ME_KEY } from '@/api/storage';
import { setAuth } from '@/store/authSlice';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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
      if (user.role === 'patient') router.replace('/(patient)/(tabs)');
      else if (user.role === 'doctor') router.replace('/(doctor)/(tabs)');
      else setErrorMsg('Admin portal access is web-only.');
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Invalid email or password.');
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    loginMutation.mutate();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.text }]}>Lumina Health</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {errorMsg ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.accentRed }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.accentRedText} />
              <Text style={[styles.errorText, { color: colors.accentRedText }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <LuminaInput label="Email Address" icon="mail-outline" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <View>
            <LuminaInput label="Password" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry={!showPassword} autoCapitalize="none" value={password} onChangeText={setPassword} />
            <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
              <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={20} color={colors.accentTeal} />
              <Text style={[styles.rememberText, { color: colors.textSecondary }]}>Remember Me</Text>
            </Pressable>
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable>
                <Text style={[styles.forgotText, { color: colors.accentTeal }]}>Forgot Password?</Text>
              </Pressable>
            </Link>
          </View>

          <LuminaButton label="Sign In" onPress={handleLogin} loading={loginMutation.isPending} />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>New to Lumina Health? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={[styles.signupLink, { color: colors.accentTeal }]}>Create Patient Account</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: LuminaSpacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { ...LuminaTypography.h1, marginBottom: LuminaSpacing.xs },
  subtitle: { ...LuminaTypography.body },
  form: { borderRadius: LuminaRadius.lg, padding: LuminaSpacing.xl, borderWidth: 1 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.xs, padding: LuminaSpacing.md, borderRadius: LuminaRadius.md, marginBottom: LuminaSpacing.lg },
  errorText: { ...LuminaTypography.bodySmall, flex: 1 },
  eyeIcon: { position: 'absolute', right: 12, top: 38, height: 48, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: LuminaSpacing.lg, marginTop: -8 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rememberText: { fontSize: 13 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { ...LuminaTypography.bodySmall },
  signupLink: { ...LuminaTypography.bodySmall, fontWeight: '600' },
});
