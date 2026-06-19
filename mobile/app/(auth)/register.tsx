import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { client } from '@/api/client';
import { LuminaColors, LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

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
    onError: (err: any) => {
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Lumina Health</Text>
          <Text style={styles.subtitle}>Create a patient account</Text>
        </View>

        <View style={styles.form}>
          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle-outline" size={24} color={LuminaColors.accentMintText} />
              <Text style={styles.successText}>Registration successful! Redirecting to login...</Text>
            </View>
          ) : (
            <>
              {errorMsg ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={18} color={LuminaColors.accentRedText} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={LuminaColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor={LuminaColors.textMuted}
                    autoCapitalize="words"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={LuminaColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={LuminaColors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={LuminaColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor={LuminaColors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={LuminaColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    placeholder="Min 8 characters"
                    placeholderTextColor={LuminaColors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={LuminaColors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[styles.button, registerMutation.isPending && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuminaColors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: LuminaSpacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    ...LuminaTypography.h1,
    color: LuminaColors.text,
    marginBottom: LuminaSpacing.xs,
  },
  subtitle: {
    ...LuminaTypography.body,
    color: LuminaColors.textSecondary,
  },
  form: {
    backgroundColor: LuminaColors.surface,
    borderRadius: LuminaRadius.lg,
    padding: LuminaSpacing.xl,
    borderWidth: 1,
    borderColor: LuminaColors.border,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.xs,
    backgroundColor: LuminaColors.accentRed,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.md,
    marginBottom: LuminaSpacing.lg,
  },
  errorText: {
    ...LuminaTypography.bodySmall,
    color: LuminaColors.accentRedText,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    padding: LuminaSpacing.xl,
    gap: LuminaSpacing.md,
  },
  successText: {
    ...LuminaTypography.body,
    color: LuminaColors.accentMintText,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: LuminaSpacing.lg,
  },
  label: {
    ...LuminaTypography.label,
    color: LuminaColors.text,
    marginBottom: LuminaSpacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LuminaColors.border,
    borderRadius: LuminaRadius.md,
    backgroundColor: LuminaColors.background,
    height: 48,
  },
  inputIcon: {
    paddingLeft: LuminaSpacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: LuminaSpacing.md,
    color: LuminaColors.text,
    fontSize: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: LuminaColors.navy,
    borderRadius: LuminaRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: LuminaSpacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    ...LuminaTypography.bodySmall,
    color: LuminaColors.textSecondary,
  },
  loginLink: {
    ...LuminaTypography.bodySmall,
    color: LuminaColors.accentTeal,
    fontWeight: '600',
  },
});
