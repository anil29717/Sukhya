import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { createFollowUp } from '@/api/followUps';
import { searchPatients } from '@/api/patients';
import { useQuery } from '@tanstack/react-query';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function ScheduleFollowUpScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  const patients = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => searchPatients({ search: patientSearch || undefined }),
    enabled: patientSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFollowUp({
        patient_id: selectedPatientId!,
        scheduled_date: scheduledDate,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      router.replace({ pathname: '/(doctor)/success', params: { type: 'follow_up_scheduled' } });
    },
    onError: () => Alert.alert('Error', 'Could not schedule follow-up. Use YYYY-MM-DD and ensure patient access.'),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Schedule Follow-Up" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <LuminaInput label="Search patient" value={patientSearch} onChangeText={setPatientSearch} placeholder="Type name..." />
          {(patients.data?.items ?? []).slice(0, 5).map((p) => (
            <Text
              key={p.id}
              style={{
                color: selectedPatientId === p.id ? colors.accentTeal : colors.text,
                fontWeight: selectedPatientId === p.id ? '700' : '400',
                paddingVertical: 8,
              }}
              onPress={() => setSelectedPatientId(p.id)}
            >
              {p.full_name}
            </Text>
          ))}
          <LuminaInput label="Date (YYYY-MM-DD)" value={scheduledDate} onChangeText={setScheduledDate} />
          <LuminaInput label="Notes" value={notes} onChangeText={setNotes} multiline />
        </LuminaCard>
        <LuminaButton
          label="Save Follow-Up"
          onPress={() => {
            if (!selectedPatientId || !scheduledDate) {
              Alert.alert('Required', 'Select a patient and enter a date.');
              return;
            }
            createMutation.mutate();
          }}
          loading={createMutation.isPending}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.md },
});
