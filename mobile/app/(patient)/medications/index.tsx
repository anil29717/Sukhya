import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { listMedications, getDueReminders, logMedicationDose } from '@/api/medications';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function MedicationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { activePatientId } = useActivePatient();

  const { data: meds, isLoading } = useQuery({
    queryKey: ['medications', activePatientId],
    queryFn: () => listMedications({ patient_id: activePatientId ?? undefined, active_only: true }),
  });

  const { data: reminders } = useQuery({ queryKey: ['medication-reminders'], queryFn: getDueReminders });

  const logMutation = useMutation({
    mutationFn: ({ medId, scheduledFor, status }: { medId: number; scheduledFor: string; status: 'taken' | 'missed' }) =>
      logMedicationDose(medId, { scheduled_for: scheduledFor, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medication-reminders'] }),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Medications" subtitle="Schedule & dose tracking" rightIcon="stats-chart-outline" onRightPress={() => router.push('/(patient)/medications/history')} />
      {isLoading ? (
        <LoadingState />
      ) : !meds?.length ? (
        <EmptyState icon="medkit-outline" title="No active medications" message="Medications prescribed by your doctor will appear here." />
      ) : (
        <FlatList
          data={meds}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            reminders && reminders.length > 0 ? (
              <View style={[styles.reminderBanner, { backgroundColor: colors.accentBlue }]}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{reminders.length} dose(s) due today</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const due = reminders?.find((r) => r.medication_id === item.id);
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary }}>{item.dosage} · {item.frequency}</Text>
                {item.instructions ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{item.instructions}</Text> : null}
                {due ? (
                  <View style={styles.actions}>
                    <Pressable style={[styles.taken, { backgroundColor: colors.accentMint }]} onPress={() => logMutation.mutate({ medId: item.id, scheduledFor: due.scheduled_for, status: 'taken' })}>
                      <Text style={{ color: colors.accentMintText, fontWeight: '700' }}>Taken</Text>
                    </Pressable>
                    <Pressable style={[styles.missed, { backgroundColor: colors.accentRed }]} onPress={() => logMutation.mutate({ medId: item.id, scheduledFor: due.scheduled_for, status: 'missed' })}>
                      <Text style={{ color: colors.accentRedText, fontWeight: '700' }}>Missed</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: LuminaSpacing.lg, gap: LuminaSpacing.sm },
  reminderBanner: { padding: LuminaSpacing.md, borderRadius: LuminaRadius.md, marginBottom: LuminaSpacing.sm },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  name: { ...LuminaTypography.h3 },
  actions: { flexDirection: 'row', gap: LuminaSpacing.sm, marginTop: LuminaSpacing.md },
  taken: { flex: 1, padding: LuminaSpacing.sm, borderRadius: LuminaRadius.md, alignItems: 'center' },
  missed: { flex: 1, padding: LuminaSpacing.sm, borderRadius: LuminaRadius.md, alignItems: 'center' },
});
