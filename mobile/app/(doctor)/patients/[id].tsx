import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getPatientHistory } from '@/api/doctor';
import { getPatient } from '@/api/patients';
import { listMedicalRecords } from '@/api/records';
import { listPrescriptions } from '@/api/prescriptions';
import { listMedications, listVitals } from '@/api/medications';
import { getHealthTimeline } from '@/api/timeline';
import { listDoctorNotes, deleteDoctorNote } from '@/api/doctorNotes';
import { calcAge, formatTime12 } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { ErrorState, LoadingSkeleton } from '@/components/lumina/ErrorState';
import { StatusBadge } from '@/components/lumina/LuminaButton';
import { SegmentedControl } from '@/components/lumina/SegmentedControl';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { openPhoneDialer } from '@/utils/phone';
import { triggerHaptic } from '@/utils/haptics';

type Tab = 'overview' | 'records' | 'timeline';

const CONDITION_COLORS: Record<string, { bg: string; color: string }> = {
  diabetes: { bg: '#FEF3C7', color: '#B45309' },
  hypertension: { bg: '#FEE2E2', color: '#B91C1C' },
  asthma: { bg: '#E0F2FE', color: '#0369A1' },
  default: { bg: '#F1F3F5', color: '#495057' },
};

function getConditionColor(c: string) {
  const key = c.toLowerCase();
  for (const k of Object.keys(CONDITION_COLORS)) {
    if (key.includes(k)) return CONDITION_COLORS[k];
  }
  return CONDITION_COLORS.default;
}

function ConditionChip({ label }: { label: string }) {
  const { bg, color } = getConditionColor(label);
  return (
    <View style={[chipS.chip, { backgroundColor: bg }]}>
      <Text style={[chipS.text, { color }]}>{label}</Text>
    </View>
  );
}

const chipS = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  text: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
});

function SectionCard({
  label,
  children,
  surfaceColor,
}: {
  label?: string;
  children: React.ReactNode;
  surfaceColor: string;
}) {
  return (
    <View style={[secS.card, LuminaShadow.sm, { backgroundColor: surfaceColor }]}>
      {label ? <Text style={secS.sectionLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

const secS = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.lg,
    padding: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#0D9B76',
    marginBottom: LuminaSpacing.md,
  },
});

function InfoRow({
  icon,
  label,
  value,
  tappable,
  onPress,
  isLast,
  valueColor,
  borderColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  tappable?: boolean;
  onPress?: () => void;
  isLast?: boolean;
  valueColor?: string;
  borderColor: string;
}) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  return (
    <Pressable
      onPress={tappable ? onPress : undefined}
      disabled={!tappable}
      style={[infoS.row, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
    >
      <View style={[infoS.iconWrap, { backgroundColor: colors.tealSoft }]}>
        <Ionicons name={icon} size={14} color={colors.teal} />
      </View>
      <View style={infoS.texts}>
        <Text style={[infoS.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[infoS.value, { color: valueColor ?? colors.text }]}>{value}</Text>
      </View>
      {tappable ? <Ionicons name="chevron-forward" size={14} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const infoS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: LuminaSpacing.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texts: { flex: 1 },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11, marginBottom: 1 },
  value: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
});

const RECORD_TYPES: Record<string, { color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  lab_report: { color: '#0BA5EC', icon: 'flask-outline' },
  prescription: { color: '#12B76A', icon: 'document-text-outline' },
  xray: { color: '#7C3AED', icon: 'scan-outline' },
  mri: { color: '#F79009', icon: 'radio-outline' },
  ctscan: { color: '#F05A2A', icon: 'layers-outline' },
};

function RecordRow({
  title,
  recordType,
  date,
  borderColor,
  onPress,
}: {
  title: string;
  recordType: string;
  date: string;
  borderColor: string;
  onPress?: () => void;
}) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const cfg = RECORD_TYPES[recordType] ?? { color: '#868E96', icon: 'document-outline' as const };
  return (
    <Pressable
      onPress={onPress}
      style={[recS.row, { borderBottomColor: borderColor }]}
    >
      <View style={[recS.iconWrap, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={recS.info}>
        <Text style={[recS.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[recS.meta, { color: colors.textSecondary }]}>
          {recordType.replace('_', ' ')} • {date}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const recS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: LuminaSpacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  title: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, marginBottom: 2 },
  meta: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11 },
});

const EVENT_COLORS: Record<string, { color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  appointment: { color: '#0D9B76', icon: 'calendar-outline' },
  prescription: { color: '#12B76A', icon: 'document-text-outline' },
  record: { color: '#0BA5EC', icon: 'folder-outline' },
  note: { color: '#7C3AED', icon: 'create-outline' },
};

function TimelineRow({
  eventType,
  title,
  description,
  date,
  isLast,
  borderColor,
  textColor,
  subtextColor,
}: {
  eventType: string;
  title: string;
  description?: string | null;
  date: string;
  isLast?: boolean;
  borderColor: string;
  textColor: string;
  subtextColor: string;
}) {
  const cfg = EVENT_COLORS[eventType] ?? EVENT_COLORS.appointment;
  return (
    <View style={tlS.row}>
      <View style={tlS.lineCol}>
        <View style={[tlS.dot, { backgroundColor: cfg.color }]}>
          <Ionicons name={cfg.icon} size={10} color="#FFFFFF" />
        </View>
        {!isLast ? <View style={[tlS.line, { backgroundColor: borderColor }]} /> : null}
      </View>
      <View style={[tlS.content, !isLast && { paddingBottom: LuminaSpacing.lg }]}>
        <Text style={[tlS.date, { color: subtextColor }]}>{date}</Text>
        <Text style={[tlS.title, { color: textColor }]}>{title}</Text>
        {description ? (
          <Text style={[tlS.desc, { color: subtextColor }]} numberOfLines={2}>{description}</Text>
        ) : null}
        <View style={[tlS.typePill, { backgroundColor: cfg.color + '18' }]}>
          <Text style={[tlS.typeText, { color: cfg.color }]}>
            {eventType.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const tlS = StyleSheet.create({
  row: { flexDirection: 'row' },
  lineCol: { alignItems: 'center', width: 28, marginRight: LuminaSpacing.md },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 4, minHeight: 20 },
  content: { flex: 1, paddingTop: 4 },
  date: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 11, marginBottom: 2 },
  title: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, marginBottom: 2 },
  desc: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  typeText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
});

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DoctorPatientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const [tab, setTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const patientId = parseInt(id!, 10);

  const patient = useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(patientId), enabled: !!id });
  const history = useQuery({
    queryKey: ['patient-history', id],
    queryFn: () => getPatientHistory(patientId),
    enabled: !!id && tab === 'overview',
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
    enabled: tab === 'overview',
  });
  const medications = useQuery({
    queryKey: ['medications', patientId],
    queryFn: () => listMedications({ patient_id: patientId }),
    enabled: tab === 'overview',
  });
  const vitals = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () => listVitals({ patient_id: patientId }),
    enabled: tab === 'overview',
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
    enabled: tab === 'overview',
    retry: false,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteDoctorNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-notes', patientId] }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      patient.refetch(),
      tab === 'overview' ? history.refetch() : Promise.resolve(),
      tab === 'records' ? records.refetch() : Promise.resolve(),
      tab === 'timeline' ? timeline.refetch() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [patient, history, records, timeline, tab]);

  if (patient.isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Profile</Text>
          <View style={styles.headerBtn} />
        </View>
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  if (patient.error || !patient.data) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Profile</Text>
          <View style={styles.headerBtn} />
        </View>
        <ErrorState onRetry={patient.refetch} />
      </View>
    );
  }

  const p = patient.data;
  const age = calcAge(p.date_of_birth);
  const displayName = p.user.full_name;
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const conditions = p.existing_conditions
    ?.split(',')
    .map((c) => c.trim())
    .filter(Boolean) ?? [];
  const historyError = history.isError && tab === 'overview';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Profile</Text>
        <Pressable style={styles.headerBtn} hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
        }
      >
        {/* Hero card */}
        <View style={[styles.heroCard, LuminaShadow.md, { backgroundColor: colors.surface }]}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, { backgroundColor: colors.tealSoft }]}>
              <Text style={[styles.avatarText, { color: colors.teal }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.heroMeta, { color: colors.textSecondary }]}>
                {[p.gender, age != null ? `${age} yrs` : null].filter(Boolean).join(' • ') || 'Patient'}
              </Text>
            </View>
          </View>

          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.teal }]}>{p.blood_group ?? '—'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Blood Group</Text>
            </View>
          </View>

          {conditions.length > 0 ? (
            <View style={styles.conditionRow}>
              {conditions.map((c) => (
                <ConditionChip key={c} label={c} />
              ))}
            </View>
          ) : p.existing_conditions ? (
            <View style={[styles.alertBanner, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.alertText, { color: '#B45309' }]} numberOfLines={2}>
                {p.existing_conditions}
              </Text>
            </View>
          ) : null}
        </View>

        <SegmentedControl
          segments={[
            { key: 'overview' as Tab, label: 'Overview' },
            { key: 'records' as Tab, label: 'Records' },
            { key: 'timeline' as Tab, label: 'Timeline' },
          ]}
          active={tab}
          onChange={setTab}
          role="doctor"
        />

        {historyError ? (
          <EmptyState
            icon="lock-closed-outline"
            title="Clinical access required"
            message="You need a prior appointment with this patient to view clinical data."
            role="doctor"
          />
        ) : null}

        {tab === 'overview' && !historyError && (
          <>
            <SectionCard label="PERSONAL DETAILS" surfaceColor={colors.surface}>
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={p.user.phone ?? '—'}
                tappable={!!p.user.phone}
                onPress={() => p.user.phone && openPhoneDialer(p.user.phone)}
                borderColor={colors.border}
              />
              <InfoRow icon="mail-outline" label="Email" value={p.user.email} borderColor={colors.border} />
              <InfoRow
                icon="calendar-outline"
                label="Date of Birth"
                value={p.date_of_birth ? formatShortDate(p.date_of_birth) : '—'}
                borderColor={colors.border}
              />
              <InfoRow
                icon="location-outline"
                label="Address"
                value="Not provided"
                borderColor={colors.border}
                isLast
              />
            </SectionCard>

            <SectionCard label="HEALTH DETAILS" surfaceColor={colors.surface}>
              <InfoRow icon="water-outline" label="Blood Group" value={p.blood_group ?? '—'} borderColor={colors.border} />
              <InfoRow
                icon="warning-outline"
                label="Allergies"
                value={p.allergies ?? 'None known'}
                valueColor={p.allergies ? '#B45309' : undefined}
                borderColor={colors.border}
              />
              <InfoRow
                icon="medkit-outline"
                label="Medications"
                value={
                  medications.data?.filter((m) => m.is_active).length
                    ? `${medications.data.filter((m) => m.is_active).length} active`
                    : 'None recorded'
                }
                borderColor={colors.border}
              />
              {p.existing_conditions || p.medical_history ? (
                <View style={[styles.chronicBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.chronicText, { color: '#92400E' }]}>
                    {p.existing_conditions || p.medical_history}
                  </Text>
                </View>
              ) : null}
            </SectionCard>

            {medications.isLoading ? (
              <LoadingSkeleton count={2} />
            ) : (medications.data ?? []).filter((m) => m.is_active).length > 0 ? (
              <SectionCard label="ACTIVE MEDICATIONS" surfaceColor={colors.surface}>
                {(medications.data ?? [])
                  .filter((m) => m.is_active)
                  .map((m, i, arr) => (
                    <View
                      key={m.id}
                      style={[styles.listRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    >
                      <Text style={[styles.listTitle, { color: colors.text }]}>{m.name}</Text>
                      <Text style={[styles.listSub, { color: colors.textSecondary }]}>
                        {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  ))}
              </SectionCard>
            ) : null}

            {vitals.isLoading ? null : (vitals.data ?? []).length > 0 ? (
              <SectionCard label="RECENT VITALS" surfaceColor={colors.surface}>
                {(vitals.data ?? []).slice(0, 5).map((v, i, arr) => (
                  <View
                    key={v.id}
                    style={[styles.listRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.listTitle, { color: colors.text, textTransform: 'capitalize' }]}>
                      {v.vital_type.replace('_', ' ')}
                    </Text>
                    <Text style={[styles.listSub, { color: colors.textSecondary }]}>
                      {v.value}{v.unit ? ` ${v.unit}` : ''} · {v.recorded_at.slice(0, 10)}
                    </Text>
                  </View>
                ))}
              </SectionCard>
            ) : null}

            {prescriptions.isLoading ? (
              <LoadingSkeleton count={2} />
            ) : (prescriptions.data?.items ?? []).length > 0 ? (
              <SectionCard label="PRESCRIPTIONS" surfaceColor={colors.surface}>
                {(prescriptions.data?.items ?? []).slice(0, 5).map((rx, i, arr) => (
                  <Pressable
                    key={rx.id}
                    onPress={() => router.push(`/(doctor)/prescriptions/${rx.id}` as never)}
                    style={[styles.listRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  >
                    <View style={styles.rowBetween}>
                      <Text
                        style={[styles.listTitle, styles.listTitleFlex, { color: colors.text }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {rx.diagnosis ?? 'Prescription'}
                      </Text>
                      <StatusBadge status={rx.status} />
                    </View>
                    <Text style={[styles.listSub, { color: colors.textMuted }]}>{rx.created_at.slice(0, 10)}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => router.push({ pathname: '/(doctor)/prescriptions/create', params: { patientId: id } })}
                  style={{ paddingTop: LuminaSpacing.md }}
                >
                  <Text style={{ color: colors.teal, fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 }}>
                    + New prescription
                  </Text>
                </Pressable>
              </SectionCard>
            ) : null}

            <SectionCard label="EMERGENCY CONTACT" surfaceColor={colors.surface}>
              <InfoRow
                icon="person-outline"
                label="Name"
                value={p.emergency_contact_name ?? 'Not provided'}
                borderColor={colors.border}
              />
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={p.emergency_contact_phone ?? '—'}
                tappable={!!p.emergency_contact_phone}
                onPress={() => p.emergency_contact_phone && openPhoneDialer(p.emergency_contact_phone)}
                borderColor={colors.border}
                isLast
              />
            </SectionCard>

            <SectionCard label="APPOINTMENT HISTORY" surfaceColor={colors.surface}>
              {history.isLoading ? (
                <LoadingSkeleton count={2} />
              ) : (history.data?.appointments ?? []).length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No appointments yet.</Text>
              ) : (
                (history.data?.appointments ?? []).slice(0, 5).map((a, i, arr) => (
                  <Pressable
                    key={a.id}
                    onPress={() => router.push(`/(doctor)/appointments/${a.id}` as never)}
                    style={[styles.listRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  >
                    <View style={styles.rowBetween}>
                      <Text
                        style={[styles.listTitle, styles.listTitleFlex, { color: colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {a.appointment_date} · {formatTime12(a.start_time)}
                      </Text>
                      <StatusBadge status={a.status} />
                    </View>
                    {a.reason ? (
                      <Text style={[styles.listSub, { color: colors.textMuted }]}>{a.reason}</Text>
                    ) : null}
                  </Pressable>
                ))
              )}
            </SectionCard>

            <SectionCard label="CLINICAL NOTES" surfaceColor={colors.surface}>
              {notes.isLoading ? (
                <LoadingSkeleton count={2} />
              ) : (notes.data ?? []).length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No clinical notes.</Text>
              ) : (
                (notes.data ?? []).map((note, i, arr) => (
                  <View
                    key={note.id}
                    style={[styles.listRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  >
                    <View style={styles.rowBetween}>
                      <Text
                        style={[styles.listTitle, styles.listTitleFlex, { color: colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {note.title}
                      </Text>
                      <Text
                        style={[styles.listSub, styles.noteTypeLabel, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {note.note_type.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={[styles.noteContent, { color: colors.textSecondary }]} numberOfLines={4}>
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
                      <Text style={{ color: colors.error, marginTop: 6, fontSize: 12 }}>Delete</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </SectionCard>
          </>
        )}

        {tab === 'records' && (
          <SectionCard label="MEDICAL RECORDS" surfaceColor={colors.surface}>
            {records.isLoading ? (
              <LoadingSkeleton count={3} />
            ) : (records.data?.items ?? []).length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No records found.</Text>
            ) : (
              (records.data?.items ?? []).map((r, i, arr) => (
                <RecordRow
                  key={r.id}
                  title={r.title}
                  recordType={r.record_type}
                  date={r.created_at.slice(0, 10)}
                  borderColor={colors.border}
                  onPress={() => router.push({ pathname: '/(doctor)/records/[id]', params: { id: String(r.id) } })}
                />
              ))
            )}
            <Pressable
              onPress={() => router.push({ pathname: '/(doctor)/prescriptions/create', params: { patientId: id } })}
              style={{ paddingTop: LuminaSpacing.md }}
            >
              <Text style={{ color: colors.teal, fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 }}>
                + Upload record for this patient
              </Text>
            </Pressable>
          </SectionCard>
        )}

        {tab === 'timeline' && (
          <SectionCard surfaceColor={colors.surface}>
            {timeline.isLoading ? (
              <LoadingSkeleton count={3} />
            ) : (timeline.data?.items ?? []).length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No timeline events yet.</Text>
            ) : (
              (timeline.data?.items ?? []).map((ev, idx, arr) => (
                <TimelineRow
                  key={`${ev.event_type}-${ev.reference_id}-${idx}`}
                  eventType={ev.event_type}
                  title={ev.title}
                  description={ev.summary}
                  date={ev.event_at.slice(0, 10)}
                  isLast={idx === arr.length - 1}
                  borderColor={colors.border}
                  textColor={colors.text}
                  subtextColor={colors.textSecondary}
                />
              ))
            )}
          </SectionCard>
        )}

        <Text style={[styles.dpdpa, { color: colors.textSecondary }]}>
          Access to this patient's data is logged per DPDPA 2023.
        </Text>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={[styles.btnOutline, { borderColor: colors.teal }]}
          onPress={() => {
            triggerHaptic('light');
            router.push({ pathname: '/(doctor)/notes/create', params: { patientId: id } });
          }}
        >
          <Ionicons name="create-outline" size={16} color={colors.teal} />
          <Text style={[styles.btnOutlineText, { color: colors.teal }]}>Write Note</Text>
        </Pressable>
        <Pressable
          style={[styles.btnFill, { backgroundColor: colors.coral }]}
          onPress={() => {
            triggerHaptic('light');
            router.push({ pathname: '/(doctor)/prescriptions/create', params: { patientId: id } });
          }}
        >
          <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
          <Text style={styles.btnFillText}>New Prescription</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 18,
  },
  scroll: { padding: LuminaSpacing.xl },
  heroCard: {
    borderRadius: LuminaRadius.lg,
    padding: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md, marginBottom: LuminaSpacing.md },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 22 },
  heroName: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 18 },
  heroMeta: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: LuminaSpacing.md,
    marginBottom: LuminaSpacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 22, marginBottom: 2 },
  statLabel: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11 },
  conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: LuminaSpacing.sm },
  alertBanner: { borderRadius: LuminaRadius.md, padding: LuminaSpacing.md, marginTop: LuminaSpacing.sm },
  alertText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, lineHeight: 18 },
  chronicBox: { borderRadius: LuminaRadius.md, padding: LuminaSpacing.md, marginTop: LuminaSpacing.md },
  chronicText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, lineHeight: 18 },
  listRow: { paddingVertical: LuminaSpacing.md },
  listTitle: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  listSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  noteContent: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, lineHeight: 20, marginTop: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: LuminaSpacing.sm },
  listTitleFlex: { flex: 1, flexShrink: 1, minWidth: 0 },
  noteTypeLabel: { flexShrink: 0, textTransform: 'capitalize', marginLeft: LuminaSpacing.sm },
  emptyText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, paddingVertical: LuminaSpacing.md },
  dpdpa: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: LuminaSpacing.sm,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: LuminaSpacing.md,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: 1,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1.5,
  },
  btnOutlineText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  btnFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    borderRadius: LuminaRadius.lg,
  },
  btnFillText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, color: '#FFFFFF' },
});
