import React, { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { requestPasswordReset } from '@/api/auth';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => requestPasswordReset(email),
    onSuccess: () => setSent(true),
    onError: () => setError('Could not send reset email. Please try again.'),
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Forgot Password" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {sent ? (
            <Text style={[styles.success, { color: colors.accentMintText }]}>
              If an account exists for {email}, reset instructions have been sent.
            </Text>
          ) : (
            <>
              <Text style={[styles.desc, { color: colors.textSecondary }]}>
                Enter your email and we will send password reset instructions.
              </Text>
              {error ? <Text style={[styles.error, { color: colors.accentRedText }]}>{error}</Text> : null}
              <LuminaInput label="Email" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
              <LuminaButton label="Send Reset Link" onPress={() => mutation.mutate()} loading={mutation.isPending} />
            </>
          )}
          <Link href="/(auth)/login" asChild>
            <Text style={[styles.link, { color: colors.accentTeal }]}>Back to Sign In</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.lg },
  form: { borderRadius: LuminaRadius.lg, padding: LuminaSpacing.xl, borderWidth: 1, gap: LuminaSpacing.lg },
  desc: { ...LuminaTypography.bodySmall },
  error: { ...LuminaTypography.bodySmall },
  success: { ...LuminaTypography.body, fontWeight: '600' },
  link: { textAlign: 'center', fontWeight: '600', marginTop: LuminaSpacing.md },
});
