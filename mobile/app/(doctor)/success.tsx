import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SuccessScreen } from '@/components/lumina/SuccessScreen';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const MESSAGES: Record<string, { title: string; message: string; icon: 'checkmark-circle' | 'medkit' | 'document-text' | 'calendar' | 'arrow-redo' }> = {
  appointment_completed: { title: 'Appointment Completed', message: 'The consultation has been marked complete.', icon: 'checkmark-circle' },
  prescription_created: { title: 'Prescription Created', message: 'The prescription has been saved successfully.', icon: 'medkit' },
  note_saved: { title: 'Note Saved', message: 'Your clinical note has been recorded.', icon: 'document-text' },
  follow_up_scheduled: { title: 'Follow-Up Scheduled', message: 'The follow-up has been added to your list.', icon: 'arrow-redo' },
};

export default function DoctorSuccessScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const config = MESSAGES[type ?? ''] ?? { title: 'Success', message: 'Action completed.', icon: 'checkmark-circle' as const };

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(doctor)/(tabs)'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <SuccessScreen title={config.title} message={config.message} icon={config.icon} />
      <LuminaButton label="Back to Dashboard" onPress={() => router.replace('/(doctor)/(tabs)')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: LuminaSpacing.lg, paddingBottom: 40, justifyContent: 'space-between' },
});
