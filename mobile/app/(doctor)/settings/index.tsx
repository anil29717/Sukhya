import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { performLogout } from '@/utils/session';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorSettingsScreen() {
  const { colors } = useLuminaTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Notifications</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Push and email preferences are managed by your clinic administrator.</Text>
        </LuminaCard>
        <LuminaCard>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Security</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Use Forgot Password on the login screen to reset your credentials.</Text>
        </LuminaCard>
        <LuminaCard>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Privacy</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Patient data access is logged per HIPAA compliance policies.</Text>
        </LuminaCard>
        <LuminaButton label="Log Out" variant="danger" onPress={() => Alert.alert('Log out?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log Out', style: 'destructive', onPress: performLogout }])} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.md, paddingBottom: 40 },
});
