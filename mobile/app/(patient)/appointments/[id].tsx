import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { formatDoctorName } from '@/api/types';
import { getAppointment, cancelAppointment, quickRebook } from '@/api/appointments';
import { LoadingState, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton, StatusBadge } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();

  const { data: appt, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(parseInt(id!, 10)),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(parseInt(id!, 10), 'Cancelled by patient'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      router.back();
    },
  });

  const rebookMutation = useMutation({
    mutationFn: () => quickRebook(parseInt(id!, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      Alert.alert('Rebooked', 'Your appointment has been rescheduled to the next available slot.');
    },
  });

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
    ]);
  };

  if (isLoading) return <><ScreenHeader title="Appointment" /><LoadingState /></>;
  if (error || !appt) return <><ScreenHeader title="Appointment" /><ErrorState onRetry={refetch} /></>;

  const canModify = ['pending', 'confirmed', 'scheduled'].includes(appt.status.toLowerCase());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Appointment Details" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatusBadge status={appt.status} />
          <Text style={[styles.doctor, { color: colors.text }]}>{formatDoctorName(appt.doctor?.full_name)}</Text>
          <Row label="Date" value={appt.appointment_date} colors={colors} />
          <Row label="Time" value={`${appt.start_time?.slice(0, 5)} – ${appt.end_time?.slice(0, 5)}`} colors={colors} />
          <Row label="Reason" value={appt.reason ?? '—'} colors={colors} />
          {appt.notes ? <Row label="Notes" value={appt.notes} colors={colors} /> : null}
          {appt.cancellation_reason ? <Row label="Cancellation" value={appt.cancellation_reason} colors={colors} /> : null}
        </View>

        {canModify ? (
          <View style={styles.actions}>
            <LuminaButton label="Reschedule" variant="secondary" icon="calendar-outline" onPress={() => router.push({ pathname: '/(patient)/book', params: { doctorId: String(appt.doctor_id) } })} />
            <LuminaButton label="Quick Rebook" variant="outline" onPress={() => rebookMutation.mutate()} loading={rebookMutation.isPending} />
            <LuminaButton label="Cancel Appointment" variant="danger" onPress={handleCancel} loading={cancelMutation.isPending} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.lg },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1, gap: LuminaSpacing.md },
  doctor: { ...LuminaTypography.h2 },
  row: { marginTop: LuminaSpacing.sm },
  rowLabel: { ...LuminaTypography.caption, fontSize: 10 },
  rowValue: { ...LuminaTypography.body, marginTop: 2 },
  actions: { gap: LuminaSpacing.sm },
});
