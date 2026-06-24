import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

import { RootState } from '@/store/store';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { performLogout } from '@/utils/session';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { user } = useSelector((s: RootState) => s.auth);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.section, { color: colors.textMuted }]}>NOTIFICATIONS</Text>
        <SettingRow label="Push Notifications" colors={colors} trailing={<Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.teal }} />} />
        <SettingRow label="Email Notifications" colors={colors} trailing={<Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: colors.teal }} />} />
        <Text style={[styles.hint, { color: colors.textMuted }]}>Notification preferences are stored locally. Backend sync coming soon.</Text>

        <Text style={[styles.section, { color: colors.textMuted }]}>SECURITY</Text>
        <LuminaButton label="Change Password" variant="outline" onPress={() => router.push('/(auth)/forgot-password')} />

        <Text style={[styles.section, { color: colors.textMuted }]}>PRIVACY</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Your health data is encrypted and stored securely. Medical record access is logged in your digital locker.</Text>

        <Text style={[styles.section, { color: colors.textMuted }]}>ACCOUNT</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: LuminaSpacing.lg }}>{user?.email}</Text>
        <LuminaButton label="Sign Out" variant="danger" onPress={() => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Sign Out', onPress: performLogout }])} />
      </ScrollView>
    </View>
  );
}

function SettingRow({ label, colors, trailing }: { label: string; colors: ReturnType<typeof useLuminaTheme>['colors']; trailing: React.ReactNode }) {
  return (
    <View style={[styles.row, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.sm },
  section: {
    fontSize: 11,
    fontFamily: LuminaFontFamily.dmSansMedium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.sm,
  },
  hint: { ...LuminaTypography.bodySmall, marginBottom: LuminaSpacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.lg,
    marginBottom: LuminaSpacing.sm,
  },
  rowLabel: { fontSize: 15, fontFamily: LuminaFontFamily.dmSansRegular },
});
