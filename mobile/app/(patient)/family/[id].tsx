import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getFamilyMember, deleteFamilyMember } from '@/api/family';
import { getUpcomingAppointments } from '@/api/appointments';
import { formatDoctorName } from '@/api/types';
import { LoadingState, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function FamilyMemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { switchToFamilyMember } = useActivePatient();

  const { data: member, isLoading, error, refetch } = useQuery({
    queryKey: ['family-member', id],
    queryFn: () => getFamilyMember(parseInt(id!, 10)),
    enabled: !!id,
  });

  const patientId = member?.dependent?.patient_id;
  const { data: appts } = useQuery({
    queryKey: ['appointments-upcoming-family', patientId],
    queryFn: () => getUpcomingAppointments(),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFamilyMember(parseInt(id!, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      router.back();
    },
  });

  if (isLoading) return <><ScreenHeader title="Family Member" /><LoadingState /></>;
  if (error || !member) return <><ScreenHeader title="Family Member" /><ErrorState onRetry={refetch} /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={member.full_name} subtitle={member.relationship} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted }}>Blood Group: {member.blood_group ?? '—'}</Text>
          <Text style={{ color: colors.textMuted }}>Allergies: {member.allergies ?? 'None'}</Text>
          <Text style={{ color: colors.textMuted }}>Emergency: {member.emergency_contact_name ?? '—'}</Text>
        </View>
        <Text style={[styles.section, { color: colors.textMuted }]}>UPCOMING APPOINTMENTS</Text>
        {appts?.items?.slice(0, 3).map((a) => (
          <Text key={a.id} style={{ color: colors.text, marginBottom: 4 }}>{a.appointment_date} — {formatDoctorName(a.doctor?.full_name)}</Text>
        )) ?? <Text style={{ color: colors.textSecondary }}>No upcoming appointments</Text>}
        <View style={styles.actions}>
          <LuminaButton label="Switch to This Profile" onPress={() => patientId && switchToFamilyMember(patientId, member.full_name)} />
          <LuminaButton label="Book Appointment" variant="secondary" onPress={() => router.push('/(patient)/(tabs)/doctors')} />
          <LuminaButton label="Remove Member" variant="danger" onPress={() => Alert.alert('Remove', 'Remove this family member?', [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate() }])} loading={deleteMutation.isPending} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.md },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1, gap: 8 },
  section: { ...LuminaTypography.caption },
  actions: { gap: LuminaSpacing.sm, marginTop: LuminaSpacing.lg },
});
