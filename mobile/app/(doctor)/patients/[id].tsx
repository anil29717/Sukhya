import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getPatientHistory } from '@/api/doctor';
import { getPatient } from '@/api/patients';
import { listMedicalRecords } from '@/api/records';
import { listPrescriptions } from '@/api/prescriptions';
import { listMedications, listVitals } from '@/api/medications';
import { getHealthTimeline } from '@/api/timeline';
import { listDoctorNotes, deleteDoctorNote } from '@/api/doctorNotes';
import { calcAge, formatTime12 } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { ErrorState, LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton, StatusBadge } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SectionLabel } from '@/components/lumina/SectionLabel';
import { TabBar } from '@/components/lumina/MetricCard';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

type Tab = 'overview' | 'clinical' | 'records' | 'timeline' | 'more';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'records', label: 'Records' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'more', label: 'More' },
];

export default function DoctorPatientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const [tab, setTab] = useState<Tab>('overview');
  const patientId = parseInt(id!, 10);

  const patient = useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(patientId), enabled: !!id });
  const needsHistory = tab === 'clinical' || tab === 'more';
  const history = useQuery({
    queryKey: ['patient-history', id],
    queryFn: () => getPatientHistory(patientId),
    enabled: !!id && needsHistory,
    retry: false,
  });

  const records = useQuery({
    queryKey: ['records', patientId],
    queryFn: () => listMedicalRecords({ patient_id: patientId }),
    enabled: tab === 'records',
  });
  const prescriptions = useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => listPrescriptions({ patient_id: patientId }),
    enabled: tab === 'clinical',
  });
  const medications = useQuery({
    queryKey: ['medications', patientId],
    queryFn: () => listMedications({ patient_id: patientId }),
    enabled: tab === 'clinical',
  });
  const vitals = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () => listVitals({ patient_id: patientId }),
    enabled: tab === 'clinical',
  });
  const timeline = useQuery({
    queryKey: ['timeline', patientId],
    queryFn: () => getHealthTimeline({ patient_id: patientId }),
    enabled: tab === 'timeline',
    retry: false,
  });
  const notes = useQuery({
    queryKey: ['doctor-notes', patientId],
    queryFn: () => listDoctorNotes({ patient_id: patientId }),
    enabled: tab === 'more',
    retry: false,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteDoctorNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-notes', patientId] }),
  });

  if (patient.isLoading) return <><ScreenHeader title="Patient" /><LoadingState /></>;
  if (patient.error || !patient.data) return <><ScreenHeader title="Patient" /><ErrorState onRetry={patient.refetch} /></>;

  const p = patient.data;
  const age = calcAge(p.date_of_birth);
  const historyError = history.isError && needsHistory;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={p.user.full_name}
        subtitle={[age != null ? `${age} yrs` : null, p.gender, p.blood_group].filter(Boolean).join(' · ') || undefined}
        rightIcon="add-circle-outline"
        onRightPress={() => router.push({ pathname: '/(doctor)/prescriptions/create', params: { patientId: id } })}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {historyError ? (
          <EmptyState
            icon="lock-closed-outline"
            title="Clinical access required"
            message="You need a prior appointment with this patient to view clinical data."
          />
        ) : null}

        {tab === 'overview' && (
          <LuminaCard elevated>
            <Row label="Email" value={p.user.email} colors={colors} />
            <Row label="Phone" value={p.user.phone ?? '—'} colors={colors} />
            <Row label="DOB" value={p.date_of_birth ?? '—'} colors={colors} />
            <Row
              label="Emergency"
              value={p.emergency_contact_name ? `${p.emergency_contact_name} (${p.emergency_contact_phone})` : '—'}
              colors={colors}
            />
          </LuminaCard>
        )}

        {tab === 'clinical' && !historyError && (
          <>
            <SectionLabel title="Medical history" />
            <LuminaCard>
              <Block title="Conditions" value={p.existing_conditions ?? 'None recorded'} colors={colors} />
              <Block title="Allergies" value={p.allergies ?? 'None recorded'} colors={colors} />
              <Block title="History" value={p.medical_history ?? 'None recorded'} colors={colors} />
            </LuminaCard>

            <SectionLabel title="Active medications" />
            {medications.isLoading ? (
              <LoadingState />
            ) : (medications.data ?? []).filter((m) => m.is_active).length === 0 ? (
              <EmptyState icon="fitness-outline" title="No active medications" />
            ) : (
              (medications.data ?? [])
                .filter((m) => m.is_active)
                .map((m) => (
                  <LuminaCard key={m.id} style={styles.listItem}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{m.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                    </Text>
                  </LuminaCard>
                ))
            )}

            <SectionLabel title="Recent vitals" />
            {vitals.isLoading ? (
              <LoadingState />
            ) : (vitals.data ?? []).length === 0 ? (
              <EmptyState icon="pulse-outline" title="No vitals recorded" />
            ) : (
              (vitals.data ?? [])
                .slice(0, 10)
                .map((v) => (
                  <LuminaCard key={v.id} style={styles.listItem}>
                    <Text style={{ color: colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                      {v.vital_type.replace('_', ' ')}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                      {v.value}
                      {v.unit ? ` ${v.unit}` : ''} · {v.recorded_at.slice(0, 10)}
                    </Text>
                  </LuminaCard>
                ))
            )}

            <SectionLabel title="Prescriptions" />
            {prescriptions.isLoading ? (
              <LoadingState />
            ) : (prescriptions.data?.items ?? []).length === 0 ? (
              <EmptyState
                icon="medkit-outline"
                title="No prescriptions"
                actionLabel="Create"
                onAction={() => router.push({ pathname: '/(doctor)/prescriptions/create', params: { patientId: id } })}
              />
            ) : (
              (prescriptions.data?.items ?? []).map((rx) => (
                <Pressable key={rx.id} onPress={() => router.push(`/(doctor)/prescriptions/${rx.id}` as never)}>
                  <LuminaCard style={styles.listItem}>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>{rx.diagnosis ?? 'Prescription'}</Text>
                      <StatusBadge status={rx.status} />
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{rx.created_at.slice(0, 10)}</Text>
                  </LuminaCard>
                </Pressable>
              ))
            )}
          </>
        )}

        {tab === 'records' && (
          records.isLoading ? (
            <LoadingState />
          ) : (records.data?.items ?? []).length === 0 ? (
            <EmptyState icon="folder-outline" title="No medical records" />
          ) : (
            (records.data?.items ?? []).map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/(doctor)/records/[id]', params: { id: String(r.id) } })}
              >
                <LuminaCard style={styles.listItem}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{r.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {r.record_type} · {r.created_at.slice(0, 10)}
                  </Text>
                </LuminaCard>
              </Pressable>
            ))
          )
        )}

        {tab === 'timeline' && (
          timeline.isLoading ? (
            <LoadingState />
          ) : (timeline.data?.items ?? []).length === 0 ? (
            <EmptyState icon="git-network-outline" title="No timeline events" />
          ) : (
            (timeline.data?.items ?? []).map((ev, idx) => (
              <LuminaCard key={`${ev.event_type}-${ev.reference_id}-${idx}`} style={styles.listItem}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{ev.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {ev.event_type} · {ev.event_at.slice(0, 10)}
                </Text>
                {ev.summary ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                    {ev.summary}
                  </Text>
                ) : null}
              </LuminaCard>
            ))
          )
        )}

        {tab === 'more' && !historyError && (
          <>
            <SectionLabel title="Appointments" />
            {history.isLoading ? (
              <LoadingState />
            ) : (history.data?.appointments ?? []).length === 0 ? (
              <EmptyState icon="calendar-outline" title="No appointments" />
            ) : (
              (history.data?.appointments ?? []).map((a) => (
                <Pressable key={a.id} onPress={() => router.push(`/(doctor)/appointments/${a.id}` as never)}>
                  <LuminaCard style={styles.listItem}>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>
                        {a.appointment_date} · {formatTime12(a.start_time)}
                      </Text>
                      <StatusBadge status={a.status} />
                    </View>
                    {a.reason ? (
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{a.reason}</Text>
                    ) : null}
                  </LuminaCard>
                </Pressable>
              ))
            )}

            <SectionLabel title="Clinical notes" />
            <LuminaButton
              label="Add note"
              icon="add-outline"
              onPress={() => router.push({ pathname: '/(doctor)/notes/create', params: { patientId: id } })}
            />
            {notes.isLoading ? (
              <LoadingState />
            ) : (notes.data ?? []).length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="No clinical notes"
                actionLabel="Create note"
                onAction={() => router.push({ pathname: '/(doctor)/notes/create', params: { patientId: id } })}
              />
            ) : (
              (notes.data ?? []).map((note) => (
                <LuminaCard key={note.id} style={styles.listItem}>
                  <View style={styles.rowBetween}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{note.title}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, textTransform: 'capitalize' }}>
                      {note.note_type.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 22 }} numberOfLines={6}>
                    {note.content}
                  </Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Delete note?', note.title, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteNoteMutation.mutate(note.id) },
                      ])
                    }
                  >
                    <Text style={{ color: colors.error, marginTop: 8, fontSize: 13 }}>Delete</Text>
                  </Pressable>
                </LuminaCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={{ flexDirection: 'row', marginTop: LuminaSpacing.sm }}>
      <Text style={{ color: colors.textSecondary, width: 100 }}>{label}</Text>
      <Text style={{ color: colors.text, flex: 1 }}>{value}</Text>
    </View>
  );
}

function Block({
  title,
  value,
  colors,
}: {
  title: string;
  value: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  return (
    <View style={{ marginTop: LuminaSpacing.md }}>
      <Text style={[styles.blockTitle, { color: colors.text }]}>{title}</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.sm },
  blockTitle: { ...LuminaTypography.label, fontWeight: '700', marginBottom: 4 },
  listItem: { marginBottom: LuminaSpacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
