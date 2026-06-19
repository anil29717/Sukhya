import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  getAppointment,
  rescheduleAppointment,
} from '@/api/appointments';
import { listDoctorNotes } from '@/api/doctorNotes';
import { LoadingState, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput, StatusBadge } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { formatTime12 } from '@/api/types';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorAppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const [completeNotes, setCompleteNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const apptId = parseInt(id!, 10);

  const { data: appt, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(apptId),
    enabled: !!id,
  });

  const { data: notes } = useQuery({
    queryKey: ['doctor-notes', appt?.patient_id],
    queryFn: () => listDoctorNotes({ patient_id: appt!.patient_id }),
    enabled: !!appt?.patient_id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['appointment', id] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => confirmAppointment(apptId),
    onSuccess: () => { invalidate(); Alert.alert('Confirmed', 'Appointment confirmed.'); },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeAppointment(apptId, completeNotes || undefined),
    onSuccess: () => {
      invalidate();
      router.replace({ pathname: '/(doctor)/success', params: { type: 'appointment_completed' } });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(apptId, 'Cancelled by doctor'),
    onSuccess: () => { invalidate(); router.back(); },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => rescheduleAppointment(apptId, { appointment_date: rescheduleDate, start_time: rescheduleTime }),
    onSuccess: () => { invalidate(); Alert.alert('Rescheduled', 'Appointment updated.'); },
    onError: () => Alert.alert('Error', 'Use YYYY-MM-DD and HH:MM:SS format for reschedule.'),
  });

  if (isLoading) return <><ScreenHeader title="Appointment" /><LoadingState /></>;
  if (error || !appt) return <><ScreenHeader title="Appointment" /><ErrorState onRetry={refetch} /></>;

  const status = appt.status.toLowerCase();
  const canConfirm = status === 'pending';
  const canComplete = ['confirmed', 'pending'].includes(status);
  const canCancel = ['pending', 'confirmed'].includes(status);
  const patientId = appt.patient_id;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Appointment Details" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <StatusBadge status={appt.status} />
          <Text style={[styles.patientName, { color: colors.text }]}>{appt.patient?.full_name ?? 'Patient'}</Text>
          <Row label="Date" value={appt.appointment_date} colors={colors} />
          <Row label="Time" value={`${formatTime12(appt.start_time)} – ${formatTime12(appt.end_time)}`} colors={colors} />
          <Row label="Reason" value={appt.reason ?? '—'} colors={colors} />
          {appt.notes ? <Row label="Notes" value={appt.notes} colors={colors} /> : null}
        </LuminaCard>

        <Text style={[styles.section, { color: colors.text }]}>Clinical Notes</Text>
        {(notes ?? []).slice(0, 3).length === 0 ? (
          <LuminaCard><Text style={{ color: colors.textSecondary }}>No notes yet</Text></LuminaCard>
        ) : (
          (notes ?? []).slice(0, 3).map((note) => (
            <LuminaCard key={note.id} style={{ marginBottom: LuminaSpacing.sm }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{note.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={3}>{note.content}</Text>
            </LuminaCard>
          ))
        )}

        <View style={styles.actions}>
          <LuminaButton label="Open Patient Profile" variant="secondary" icon="person-outline" onPress={() => router.push(`/(doctor)/patients/${patientId}` as never)} />
          <LuminaButton label="Create Prescription" variant="outline" icon="medkit-outline" onPress={() => router.push({ pathname: '/(doctor)/prescriptions/create', params: { patientId: String(patientId), appointmentId: String(appt.id) } })} />
          <LuminaButton label="Add Note" variant="outline" icon="document-text-outline" onPress={() => router.push({ pathname: '/(doctor)/notes/create', params: { patientId: String(patientId), appointmentId: String(appt.id) } })} />
          {canConfirm ? <LuminaButton label="Confirm Appointment" onPress={() => confirmMutation.mutate()} loading={confirmMutation.isPending} /> : null}
          {canComplete ? (
            <>
              <LuminaInput label="Completion notes (optional)" value={completeNotes} onChangeText={setCompleteNotes} multiline />
              <LuminaButton label="Mark Complete" onPress={() => completeMutation.mutate()} loading={completeMutation.isPending} />
            </>
          ) : null}
          {canCancel ? (
            <>
              <LuminaInput label="Reschedule date (YYYY-MM-DD)" value={rescheduleDate} onChangeText={setRescheduleDate} />
              <LuminaInput label="Start time (HH:MM:SS)" value={rescheduleTime} onChangeText={setRescheduleTime} />
              <LuminaButton label="Reschedule" variant="secondary" onPress={() => rescheduleMutation.mutate()} loading={rescheduleMutation.isPending} />
              <LuminaButton label="Cancel Appointment" variant="danger" onPress={() => Alert.alert('Cancel?', 'Cancel this appointment?', [{ text: 'No', style: 'cancel' }, { text: 'Yes', style: 'destructive', onPress: () => cancelMutation.mutate() }])} loading={cancelMutation.isPending} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.textSecondary, width: 90 }}>{label}</Text>
      <Text style={{ color: colors.text, flex: 1 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.md },
  patientName: { ...LuminaTypography.h2, marginVertical: LuminaSpacing.sm },
  section: { ...LuminaTypography.h3 },
  row: { flexDirection: 'row', marginTop: LuminaSpacing.sm },
  actions: { gap: LuminaSpacing.sm, marginTop: LuminaSpacing.md },
});
