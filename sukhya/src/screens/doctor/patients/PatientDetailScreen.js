import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatShortDate, formatPhone, formatCurrency } from '../../../utils/format';

// ─── API ──────────────────────────────────────────────────────────
const fetchPatient   = (id) => apiFetch(`/patients/${id}`);
const fetchRecords   = (id) => apiFetch(`/medical-records?patient_id=${id}&page=1&page_size=20`);
const fetchTimeline  = (id) => apiFetch(`/health-timeline?patient_id=${id}&page=1&page_size=20`);

// ─── Condition chip ───────────────────────────────────────────────
const CONDITION_COLORS = {
  diabetes:     { bg: '#FEF3C7', color: '#B45309' },
  hypertension: { bg: '#FEE2E2', color: '#B91C1C' },
  asthma:       { bg: '#E0F2FE', color: '#0369A1' },
  heart:        { bg: '#FEE2E2', color: '#B91C1C' },
  thyroid:      { bg: '#EDE9FE', color: '#6D28D9' },
  default:      { bg: '#F1F3F5', color: '#495057' },
};

function getConditionColor(c) {
  const key = c?.toLowerCase();
  for (const k of Object.keys(CONDITION_COLORS)) {
    if (key?.includes(k)) return CONDITION_COLORS[k];
  }
  return CONDITION_COLORS.default;
}

function ConditionChip({ label }) {
  const { bg, color } = getConditionColor(label);
  return (
    <View style={[chipS.chip, { backgroundColor: bg }]}>
      <Text style={[chipS.text, { color }]}>{label}</Text>
    </View>
  );
}

const chipS = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  text: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs },
});

// ─── Segmented control ────────────────────────────────────────────
function SegControl({ tabs, active, onChange, colors }) {
  return (
    <View style={[segS.wrap, { backgroundColor: colors.neutral100 ?? '#F1F3F5' }]}>
      {tabs.map((t, i) => (
        <TouchableOpacity
          key={t}
          style={[segS.tab, active === i && { backgroundColor: colors.teal }]}
          onPress={() => onChange(i)}
          activeOpacity={0.8}
        >
          <Text style={[segS.text, { color: active === i ? '#FFFFFF' : colors.textSecondary }]}>
            {t}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segS = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: Radius.md, padding: 4, marginBottom: Spacing[4] },
  tab:  { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },
});

// ─── Info row ─────────────────────────────────────────────────────
function InfoRow({ icon, label, value, tappable, onPress, isLast, colors }) {
  return (
    <TouchableOpacity
      style={[infoS.row, { borderBottomColor: colors.border }, isLast && { borderBottomWidth: 0 }]}
      onPress={tappable ? onPress : undefined}
      activeOpacity={tappable ? 0.7 : 1}
      disabled={!tappable}
    >
      <View style={[infoS.iconWrap, { backgroundColor: colors.tealLight }]}>
        <Ionicons name={icon} size={14} color={colors.teal} />
      </View>
      <View style={infoS.texts}>
        <Text style={[infoS.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[infoS.value, { color: tappable ? colors.teal : colors.textPrimary }]}>
          {value ?? '—'}
        </Text>
      </View>
      {tappable && <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />}
    </TouchableOpacity>
  );
}

const infoS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: Spacing[3],
  },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  texts: { flex: 1 },
  label: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginBottom: 1 },
  value: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
});

// ─── Record type config ───────────────────────────────────────────
const RECORD_TYPES = {
  lab_report:       { color: '#0BA5EC', icon: 'flask-outline' },
  prescription:     { color: '#12B76A', icon: 'document-text-outline' },
  xray:             { color: '#7C3AED', icon: 'scan-outline' },
  mri:              { color: '#F79009', icon: 'radio-outline' },
  ctscan:           { color: '#F05A2A', icon: 'layers-outline' },
  diagnostic_report:{ color: '#868E96', icon: 'bar-chart-outline' },
};

// ─── Record row ───────────────────────────────────────────────────
function RecordRow({ item, colors }) {
  const cfg = RECORD_TYPES[item.record_type] ?? { color: '#868E96', icon: 'document-outline' };
  return (
    <View style={[recS.row, { borderBottomColor: colors.border }]}>
      <View style={[recS.iconWrap, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={recS.info}>
        <Text style={[recS.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.title ?? 'Medical Record'}
        </Text>
        <Text style={[recS.meta, { color: colors.textSecondary }]}>
          {item.record_type?.replace('_', ' ')} • {item.created_at ? formatShortDate(item.created_at) : '—'}
        </Text>
      </View>
      <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="download-outline" size={18} color={colors.teal} />
      </TouchableOpacity>
    </View>
  );
}

const recS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, gap: Spacing[3] },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1 },
  title: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginBottom: 2 },
  meta: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
});

// ─── Timeline event row ───────────────────────────────────────────
const EVENT_COLORS = {
  appointment: { color: '#0D9B76', icon: 'calendar-outline' },
  prescription:{ color: '#12B76A', icon: 'document-text-outline' },
  record:      { color: '#0BA5EC', icon: 'folder-outline' },
  note:        { color: '#7C3AED', icon: 'create-outline' },
  followup:    { color: '#F79009', icon: 'return-up-forward-outline' },
};

function TimelineRow({ item, isLast, colors }) {
  const cfg = EVENT_COLORS[item.event_type] ?? EVENT_COLORS.appointment;
  return (
    <View style={tlS.row}>
      <View style={tlS.lineCol}>
        <View style={[tlS.dot, { backgroundColor: cfg.color }]}>
          <Ionicons name={cfg.icon} size={10} color="#FFFFFF" />
        </View>
        {!isLast && <View style={[tlS.line, { backgroundColor: colors.border }]} />}
      </View>
      <View style={[tlS.content, !isLast && { paddingBottom: Spacing[4] }]}>
        <Text style={[tlS.date, { color: colors.textSecondary }]}>
          {item.event_date ? formatShortDate(item.event_date) : '—'}
        </Text>
        <Text style={[tlS.title, { color: colors.textPrimary }]}>{item.title ?? 'Health event'}</Text>
        {item.description && (
          <Text style={[tlS.desc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={[tlS.typePill, { backgroundColor: cfg.color + '18' }]}>
          <Text style={[tlS.typeText, { color: cfg.color }]}>
            {item.event_type?.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const tlS = StyleSheet.create({
  row: { flexDirection: 'row' },
  lineCol: { alignItems: 'center', width: 28, marginRight: Spacing[3] },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 4, minHeight: 20 },
  content: { flex: 1, paddingTop: 4 },
  date: { fontFamily: FontFamily.dmMonoMedium, fontSize: FontSize.xs, marginBottom: 2 },
  title: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginBottom: 2 },
  desc: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, lineHeight: 18, marginBottom: 4 },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  typeText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs },
});

// ─── Section card ─────────────────────────────────────────────────
function SectionCard({ label, children, colors }) {
  return (
    <View style={[scS.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      {label && <Text style={[scS.label, { color: colors.teal }]}>{label}</Text>}
      {children}
    </View>
  );
}

const scS = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3] },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function PatientDetailScreen({ navigation, route }) {
  const { patientId } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { data: patient, isLoading, refetch: refetchPatient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetchPatient(patientId),
    enabled: !!patientId,
  });

  const { data: recordsData, refetch: refetchRecords } = useQuery({
    queryKey: ['patient-records', patientId],
    queryFn: () => fetchRecords(patientId),
    enabled: !!patientId && activeTab === 1,
  });

  const { data: timelineData, refetch: refetchTimeline } = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: () => fetchTimeline(patientId),
    enabled: !!patientId && activeTab === 2,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchPatient(), refetchRecords(), refetchTimeline()]);
    setRefreshing(false);
  }, []);

  const records  = recordsData?.items ?? recordsData ?? [];
  const timeline = timelineData?.items ?? timelineData ?? [];

  const initials = (patient?.full_name ?? 'P')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const conditions = patient?.medical_conditions
    ? patient.medical_conditions.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Overview tab ──
  const renderOverview = () => (
    <>
      <SectionCard label="PERSONAL DETAILS" colors={colors}>
        <InfoRow icon="call-outline"     label="Phone"         value={patient?.phone ? formatPhone(patient.phone) : '—'} tappable={!!patient?.phone} onPress={() => Linking.openURL(`tel:${patient.phone}`)} colors={colors} />
        <InfoRow icon="mail-outline"     label="Email"         value={patient?.email}    colors={colors} />
        <InfoRow icon="calendar-outline" label="Date of Birth" value={patient?.date_of_birth ? formatShortDate(patient.date_of_birth) : '—'} colors={colors} />
        <InfoRow icon="location-outline" label="Address"       value={patient?.address ?? 'Not provided'} colors={colors} isLast />
      </SectionCard>

      <SectionCard label="HEALTH DETAILS" colors={colors}>
        <InfoRow icon="water-outline"   label="Blood Group"   value={patient?.blood_group ?? '—'}        colors={colors} />
        <InfoRow icon="warning-outline" label="Allergies"     value={patient?.allergies ?? 'None known'} valueColor={patient?.allergies ? '#B45309' : undefined} colors={colors} />
        <InfoRow icon="medkit-outline"  label="Medications"   value={patient?.current_medications ?? 'None recorded'} colors={colors} />
        <View style={{ paddingTop: Spacing[3] }}>
          <Text style={[{ fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: Spacing[2] }]}>
            Chronic Conditions
          </Text>
          {conditions.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {conditions.map((c, i) => <ConditionChip key={i} label={c} />)}
            </View>
          ) : (
            <Text style={{ fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, color: colors.textSecondary }}>
              None recorded
            </Text>
          )}
        </View>
      </SectionCard>

      <SectionCard label="EMERGENCY CONTACT" colors={colors}>
        <InfoRow icon="person-outline" label="Name" value={patient?.emergency_contact_name ?? 'Not provided'} colors={colors} />
        <InfoRow icon="call-outline"   label="Phone" value={patient?.emergency_contact_phone ? formatPhone(patient.emergency_contact_phone) : '—'} tappable={!!patient?.emergency_contact_phone} onPress={() => Linking.openURL(`tel:${patient.emergency_contact_phone}`)} colors={colors} isLast />
      </SectionCard>

      <SectionCard label="APPOINTMENT SUMMARY" colors={colors}>
        <InfoRow icon="repeat-outline"     label="Total Appointments"  value={String(patient?.total_appointments ?? 0)} colors={colors} />
        <InfoRow icon="calendar-outline"   label="First Visit"         value={patient?.first_appointment_date ? formatShortDate(patient.first_appointment_date) : '—'} colors={colors} />
        <InfoRow icon="time-outline"       label="Last Visit"          value={patient?.last_appointment_date ? formatShortDate(patient.last_appointment_date) : '—'} colors={colors} />
        <TouchableOpacity
          onPress={() => navigation.navigate('PatientHistory', { patientId })}
          style={{ paddingTop: Spacing[3] }}
        >
          <Text style={{ color: colors.teal, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm }}>
            View all appointments →
          </Text>
        </TouchableOpacity>
      </SectionCard>
    </>
  );

  // ── Records tab ──
  const renderRecords = () => (
    <SectionCard label="MEDICAL RECORDS" colors={colors}>
      {records.length === 0 ? (
        <Text style={{ fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, color: colors.textSecondary, paddingVertical: Spacing[3] }}>
          No records found.
        </Text>
      ) : (
        records.map((r, i) => (
          <RecordRow key={r.id ?? i} item={r} colors={colors} />
        ))
      )}
      <TouchableOpacity
        style={{ paddingTop: Spacing[3] }}
        onPress={() => navigation.navigate('ClinicalTab', { screen: 'CreatePrescription', params: { patientId } })}
      >
        <Text style={{ color: colors.teal, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm }}>
          + Upload record for this patient
        </Text>
      </TouchableOpacity>
    </SectionCard>
  );

  // ── Timeline tab ──
  const renderTimeline = () => (
    <SectionCard colors={colors}>
      {timeline.length === 0 ? (
        <Text style={{ fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, color: colors.textSecondary, paddingVertical: Spacing[3] }}>
          No timeline events yet.
        </Text>
      ) : (
        timeline.map((item, i) => (
          <TimelineRow key={item.id ?? i} item={item} isLast={i === timeline.length - 1} colors={colors} />
        ))
      )}
    </SectionCard>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patient Profile</Text>
          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, Shadow.md, { backgroundColor: colors.surface }]}>
          {/* Top row */}
          <View style={styles.heroTop}>
            <View style={[styles.avatar, { backgroundColor: colors.tealLight }]}>
              <Text style={[styles.avatarText, { color: colors.teal }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {patient?.full_name ?? 'Patient'}
              </Text>
              <Text style={[styles.hereMeta, { color: colors.textSecondary }]}>
                {[patient?.age && `${patient.age} yrs`, patient?.gender]
                  .filter(Boolean).join(' • ') || 'Patient'}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            {[
              { value: patient?.blood_group ?? '—', label: 'Blood Group' },
              { value: patient?.age ? String(patient.age) : '—', label: 'Age' },
              { value: patient?.bmi ? String(patient.bmi) : '—', label: 'BMI' },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 2 && { borderRightColor: colors.border, borderRightWidth: 1 }]}>
                <Text style={[styles.statValue, { color: colors.teal }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Conditions */}
          {conditions.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: Spacing[3] }}>
              {conditions.map((c, i) => <ConditionChip key={i} label={c} />)}
            </ScrollView>
          )}
        </View>

        {/* Tabs */}
        <SegControl
          tabs={['Overview', 'Records', 'Timeline']}
          active={activeTab}
          onChange={setActiveTab}
          colors={colors}
        />

        {activeTab === 0 && renderOverview()}
        {activeTab === 1 && renderRecords()}
        {activeTab === 2 && renderTimeline()}

        {/* DPDPA */}
        <Text style={[styles.dpdpa, { color: colors.textSecondary }]}>
          Access to this patient's data is logged per DPDPA 2023.
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: colors.teal, flex: 1 }]}
          onPress={() =>
            navigation.navigate('ClinicalTab', {
              screen: 'CreateNote',
              params: {
                patientId,
                patientName: patient?.full_name ?? patient?.user?.full_name,
              },
            })
          }
        >
          <Ionicons name="create-outline" size={16} color={colors.teal} />
          <Text style={[styles.btnOutlineText, { color: colors.teal }]}>Write Note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnFill, { backgroundColor: colors.coral, flex: 1 }]}
          onPress={() =>
            navigation.navigate('ClinicalTab', {
              screen: 'CreatePrescription',
              params: {
                patientId,
                patientName: patient?.full_name ?? patient?.user?.full_name,
              },
            })
          }
        >
          <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
          <Text style={styles.btnFillText}>New Prescription</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.nunitoBold, fontSize: 18, flex: 1, textAlign: 'center' },
  moreBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },

  heroCard: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3] },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: FontFamily.nunitoBold, fontSize: 22 },
  name: { fontFamily: FontFamily.nunitoBold, fontSize: 20, marginBottom: 3 },
  hereMeta: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: Spacing[3],
    paddingVertical: Spacing[3],
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: FontFamily.dmMonoMedium, fontSize: 18, marginBottom: 3 },
  statLabel: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },

  dpdpa: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[4],
  },

  actionBar: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    paddingBottom: Spacing[8],
    borderTopWidth: 1,
  },
  btnOutline: {
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnOutlineText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
  btnFill: {
    height: 50,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnFillText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.sm, color: '#FFFFFF' },
});