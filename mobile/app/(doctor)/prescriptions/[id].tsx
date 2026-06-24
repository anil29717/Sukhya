import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getPrescription, sharePrescription } from '@/api/prescriptions';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton, StatusBadge } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'doctor' });

  const { data: rx, isLoading, error, refetch } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => getPrescription(parseInt(id!, 10)),
    enabled: !!id,
  });

  const shareMutation = useMutation({
    mutationFn: () => sharePrescription(parseInt(id!, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', id] });
      Alert.alert('Shared', 'Prescription is now visible to the patient.');
    },
  });

  if (isLoading) return <><ScreenHeader title="Prescription" /><LoadingSkeleton count={3} /></>;
  if (error || !rx) return <><ScreenHeader title="Prescription" /><ErrorState onRetry={refetch} /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Prescription Details" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <StatusBadge status={rx.status} />
          <Text style={[styles.diagnosis, { color: colors.text }]}>{rx.diagnosis ?? 'Prescription'}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Created {rx.created_at.slice(0, 10)}</Text>
          {rx.patient_name ? <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Patient: {rx.patient_name}</Text> : null}
        </LuminaCard>

        <Text style={[styles.section, { color: colors.text }]}>Medications</Text>
        {rx.medications.map((med, i) => (
          <LuminaCard key={i} style={{ marginBottom: LuminaSpacing.sm }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{med.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')}
            </Text>
          </LuminaCard>
        ))}

        {rx.instructions ? (
          <>
            <Text style={[styles.section, { color: colors.text }]}>Instructions</Text>
            <LuminaCard><Text style={{ color: colors.textSecondary }}>{rx.instructions}</Text></LuminaCard>
          </>
        ) : null}

        {rx.status === 'draft' ? (
          <LuminaButton label="Share with Patient" onPress={() => shareMutation.mutate()} loading={shareMutation.isPending} />
        ) : null}
        <LuminaButton label="View Patient" variant="outline" onPress={() => router.push(`/(doctor)/patients/${rx.patient_id}` as never)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40 },
  diagnosis: { ...LuminaTypography.h2, marginVertical: LuminaSpacing.sm },
  section: { ...LuminaTypography.h3, marginTop: LuminaSpacing.lg, marginBottom: LuminaSpacing.sm },
});
