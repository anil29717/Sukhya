/**
 * Patient Home Screen — Premium redesign
 * Layout: Coral hero → floating stats → Today / Health / Timeline tabs
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getUpcomingAppointments } from '@/api/appointments';
import { listFamilyMembers } from '@/api/family';
import { getLockerSummary } from '@/api/family';
import { getDueReminders, listVitals, logMedicationDose } from '@/api/medications';
import { getMyPatientProfile } from '@/api/patients';
import { listPrescriptions } from '@/api/prescriptions';
import { getHealthTimeline } from '@/api/timeline';
import { formatDoctorName } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ActionTile } from '@/components/lumina/ActionTile';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useNotifications } from '@/hooks/useNotifications';
import { RootState } from '@/store/store';
import {
  LuminaFontFamily,
  LuminaRadius,
  LuminaShadow,
  LuminaSpacing,
  LuminaTypography,
  getStatusStyle,
  getTimeGreeting,
} from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type HomeTab = 'today' | 'health' | 'timeline';

// Relationship → accent color
const RELATION_COLOR: Record<string, string> = {
  self: '#F05A2A',
  spouse: '#0D9B76',
  parent: '#7C3AED',
  child: '#0BA5EC',
  sibling: '#F79009',
};
const relColor = (rel?: string) => RELATION_COLOR[rel?.toLowerCase() ?? ''] ?? '#868E96';

function cardSurface() {
  return Platform.OS === 'ios' ? [LuminaShadow.card] : [];
}

function stripDrPrefix(name: string) {
  return name.replace(/^dr\.?\s+/i, '').trim();
}

function formatApptDate(dateStr?: string) {
  if (!dateStr) return 'None';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatApptTime(timeStr: string) {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr?.slice(0, 2) ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatChip({
  icon,
  label,
  value,
  accent,
  onPress,
  colors,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
  onPress?: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        chipStyles.chip,
        ...cardSurface(),
        { backgroundColor: colors.surface, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[chipStyles.iconWrap, { backgroundColor: accent ? colors.coralSoft : colors.tealSoft }]}>
        <Ionicons name={icon} size={16} color={accent ? colors.coral : colors.teal} />
      </View>
      <Text style={[chipStyles.value, { color: accent ? colors.coral : colors.text }]}>{value}</Text>
      <Text style={[chipStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: LuminaRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 5,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: LuminaRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
  },
});

function SectionTitle({
  label,
  action,
  onAction,
  colors,
}: {
  label: string;
  action?: string;
  onAction?: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
      <Text style={{ fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11, color: colors.coral, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13, color: colors.teal }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── TODAY TAB ─────────────────────────────────────────────────────────────────

function TodayTab({
  appt,
  reminders,
  isLoadingAppts,
  logDoseMutation,
  colors,
  isDark,
  router,
}: {
  appt: ReturnType<typeof useQuery<any>>['data'];
  reminders: any[] | undefined;
  isLoadingAppts: boolean;
  logDoseMutation: ReturnType<typeof useMutation<any, any, any>>;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  isDark: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const QUICK_ACTIONS = [
    { icon: 'calendar-outline' as const, label: 'Book Appointment', route: '/(patient)/(tabs)/doctors' as const, bg: colors.coralSoft, ic: colors.coral },
    { icon: 'cloud-upload-outline' as const, label: 'Upload Record', route: '/(patient)/(tabs)/records' as const, bg: colors.tealSoft, ic: colors.teal },
    { icon: 'medkit-outline' as const, label: 'Prescriptions', route: '/(patient)/prescriptions' as const, bg: '#EDE9FE', ic: '#7C3AED' },
    { icon: 'pulse-outline' as const, label: 'Add Vitals', route: '/(patient)/vitals/add' as const, bg: '#FEF3C7', ic: '#F79009' },
  ];

  const apptData = appt as any;
  const { color: statusColor, bg: statusBg } = apptData
    ? getStatusStyle(apptData.status, colors)
    : { color: colors.textMuted, bg: colors.border };

  return (
    <View style={{ gap: 20 }}>
      {/* Next appointment */}
      <View>
        <SectionTitle label="Upcoming visit" action={apptData ? 'See all' : undefined} onAction={() => router.push('/(patient)/appointments')} colors={colors} />
        {isLoadingAppts ? (
          <LoadingSkeleton count={1} />
        ) : apptData ? (
          <Pressable
            onPress={() => { triggerHaptic('light'); router.push(`/(patient)/appointments/${apptData.id}`); }}
            style={({ pressed }) => [
              apptStyles.card,
              ...cardSurface(),
              { backgroundColor: colors.surface, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <View style={[apptStyles.bar, { backgroundColor: statusColor }]} />
            <View style={apptStyles.body}>
              <View style={apptStyles.topRow}>
                <Text style={[apptStyles.time, { color: colors.textSecondary }]}>
                  {apptData.start_time ? formatApptTime(apptData.start_time) : ''}
                </Text>
                <View style={[apptStyles.badge, { backgroundColor: statusBg }]}>
                  <Text style={[apptStyles.badgeText, { color: statusColor }]}>
                    {apptData.status?.charAt(0).toUpperCase() + apptData.status?.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={[apptStyles.docName, { color: colors.text }]} numberOfLines={1}>
                {formatDoctorName(apptData.doctor?.full_name)}
              </Text>
              {apptData.reason ? (
                <Text style={[apptStyles.reason, { color: colors.textSecondary }]} numberOfLines={1}>
                  {apptData.reason}
                </Text>
              ) : null}
              <View style={apptStyles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text style={[apptStyles.dateText, { color: colors.textMuted }]}>
                  {formatApptDate(apptData.appointment_date)}
                </Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/(patient)/(tabs)/doctors')}
            style={[apptStyles.emptyAppt, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.coral} />
            <View style={{ flex: 1 }}>
              <Text style={[{ fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, color: colors.coral }]}>
                No upcoming appointment
              </Text>
              <Text style={[{ fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, color: colors.coral + 'BB' }]}>
                Tap to book your next visit
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.coral} />
          </Pressable>
        )}
      </View>

      {/* Quick actions */}
      <View>
        <SectionTitle label="Quick actions" colors={colors} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {QUICK_ACTIONS.map((a) => (
            <ActionTile
              key={a.label}
              layout="carousel"
              icon={a.icon}
              label={a.label}
              iconColor={a.ic}
              iconBg={a.bg}
              onPress={() => router.push(a.route)}
              role="patient"
            />
          ))}
        </ScrollView>
      </View>

      {/* Today's medications */}
      {reminders && reminders.length > 0 ? (
        <View>
          <SectionTitle label="Today's medications" action="View all" onAction={() => router.push('/(patient)/medications')} colors={colors} />
          {reminders.slice(0, 3).map((r) => (
            <View
              key={`${r.medication_id}-${r.scheduled_for}`}
              style={[
                medStyles.row,
                ...cardSurface(),
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={[medStyles.icon, { backgroundColor: colors.tealSoft }]}>
                <Ionicons name="medical-outline" size={18} color={colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[medStyles.name, { color: colors.text }]}>{r.medication_name}</Text>
                <Text style={[medStyles.time, { color: colors.textSecondary }]}>
                  {new Date(r.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Pressable
                style={[medStyles.takenBtn, { backgroundColor: colors.tealSoft }]}
                onPress={() => {
                  triggerHaptic('success');
                  logDoseMutation.mutate({ medId: r.medication_id, scheduledFor: r.scheduled_for });
                }}
              >
                <Text style={[medStyles.takenText, { color: colors.teal }]}>Taken</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const apptStyles = StyleSheet.create({
  card: { borderRadius: LuminaRadius.xl, flexDirection: 'row', overflow: 'hidden' },
  bar: { width: 4 },
  body: { flex: 1, padding: 16, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: LuminaRadius.full },
  badgeText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
  docName: { fontFamily: LuminaFontFamily.nunitoSemiBold, fontSize: 17 },
  reason: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
  emptyAppt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});

const medStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: LuminaRadius.xl,
    marginBottom: 8,
  },
  icon: { width: 38, height: 38, borderRadius: LuminaRadius.full, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  time: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 12, marginTop: 2 },
  takenBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: LuminaRadius.full },
  takenText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 12 },
});

// ─── HEALTH TAB ────────────────────────────────────────────────────────────────

function HealthTab({
  heartRate,
  bloodPressure,
  weight,
  recordsCount,
  activeRx,
  upcomingCount,
  vitalsCount,
  colors,
  isDark,
  router,
}: {
  heartRate: string;
  bloodPressure: string;
  weight: string;
  recordsCount: number;
  activeRx: number;
  upcomingCount: number;
  vitalsCount: number;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  isDark: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const vitals = [
    { label: 'Blood Pressure', value: bloodPressure, unit: 'mmHg', icon: 'heart' as const, bg: '#FEE2E2', ic: '#F04438' },
    { label: 'Heart Rate', value: String(heartRate), unit: 'bpm', icon: 'pulse-outline' as const, bg: '#FEF0EB', ic: '#F05A2A' },
    { label: 'Weight', value: weight === '—' ? '—' : String(weight), unit: weight !== '—' ? 'kg' : '', icon: 'barbell-outline' as const, bg: '#E0F2FE', ic: '#0BA5EC' },
  ];

  const summary = [
    { label: 'Records', value: recordsCount, icon: 'folder-outline' as const, route: '/(patient)/(tabs)/records' as const },
    { label: 'Prescriptions', value: activeRx, icon: 'medkit-outline' as const, route: '/(patient)/prescriptions' as const },
    { label: 'Upcoming', value: upcomingCount, icon: 'calendar-outline' as const, route: '/(patient)/appointments' as const },
    { label: 'Vitals', value: vitalsCount, icon: 'pulse-outline' as const, route: '/(patient)/vitals' as const },
  ];

  return (
    <View style={{ gap: 20 }}>
      {/* Vitals */}
      <View>
        <SectionTitle
          label="Vitals"
          action="Add vital"
          onAction={() => router.push('/(patient)/vitals/add')}
          colors={colors}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {vitals.map((v) => (
            <Pressable
              key={v.label}
              onPress={() => router.push('/(patient)/vitals')}
              style={({ pressed }) => [
                vitalStyles.card,
                ...cardSurface(),
                { backgroundColor: colors.surface, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <View style={[vitalStyles.iconWrap, { backgroundColor: v.bg }]}>
                <Ionicons name={v.icon} size={18} color={v.ic} />
              </View>
              <Text style={[vitalStyles.value, { color: colors.text }]}>{v.value}</Text>
              {v.unit ? <Text style={[vitalStyles.unit, { color: colors.textMuted }]}>{v.unit}</Text> : null}
              <Text style={[vitalStyles.label, { color: colors.textSecondary }]}>{v.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Summary stats */}
      <View>
        <SectionTitle label="Health summary" colors={colors} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {summary.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => router.push(s.route)}
              style={({ pressed }) => [
                summaryStyles.card,
                ...cardSurface(),
                { backgroundColor: colors.surface, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <View style={[summaryStyles.iconWrap, { backgroundColor: colors.coralSoft }]}>
                <Ionicons name={s.icon} size={18} color={colors.coral} />
              </View>
              <Text style={[summaryStyles.number, { color: colors.text }]}>{s.value}</Text>
              <Text style={[summaryStyles.label, { color: colors.textSecondary }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const vitalStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: LuminaRadius.xl,
    padding: 14,
    alignItems: 'center',
    gap: 5,
  },
  iconWrap: { width: 38, height: 38, borderRadius: LuminaRadius.full, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 16 },
  unit: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 10, marginTop: -4 },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11, textAlign: 'center' },
});

const summaryStyles = StyleSheet.create({
  card: {
    width: (SCREEN_WIDTH - LuminaSpacing.xl * 2 - 10) / 2,
    borderRadius: LuminaRadius.xl,
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  iconWrap: { width: 38, height: 38, borderRadius: LuminaRadius.full, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 22 },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },
});

// ─── TIMELINE TAB ──────────────────────────────────────────────────────────────

const TIMELINE_EVENT_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string; ic: string }> = {
  appointment: { icon: 'calendar', bg: '#E0F2FE', ic: '#0BA5EC' },
  prescription: { icon: 'medkit', bg: '#DCFCE7', ic: '#12B76A' },
  record: { icon: 'document-text', bg: '#EDE9FE', ic: '#7C3AED' },
  vital: { icon: 'pulse', bg: '#FEF0EB', ic: '#F05A2A' },
  note: { icon: 'pencil', bg: '#FEF3C7', ic: '#F79009' },
};

function getTimelineIcon(eventType: string) {
  const key = Object.keys(TIMELINE_EVENT_ICONS).find((k) => eventType.toLowerCase().includes(k));
  return TIMELINE_EVENT_ICONS[key ?? ''] ?? { icon: 'ellipse' as const, bg: '#F1F3F5', ic: '#868E96' };
}

function TimelineTab({
  timelineData,
  colors,
  router,
}: {
  timelineData: any;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  router: ReturnType<typeof useRouter>;
}) {
  const items = timelineData?.items ?? [];

  if (!items.length) {
    return (
      <EmptyState
        icon="time-outline"
        title="Your health story starts here"
        message="Book appointments, log vitals, and upload records to build your timeline."
        role="patient"
      />
    );
  }

  return (
    <View style={{ gap: 0 }}>
      <SectionTitle
        label="Recent activity"
        action="View full timeline"
        onAction={() => router.push('/(patient)/(tabs)/timeline')}
        colors={colors}
      />
      {items.map((ev: any, index: number) => {
        const tileInfo = getTimelineIcon(ev.event_type ?? '');
        const isLast = index === items.length - 1;
        // Strip Dr. prefix from timeline titles if present
        const title = ev.title ? ev.title.replace(/\bDr\.\s+Dr\.\s*/gi, 'Dr. ') : '';
        return (
          <Pressable
            key={`${ev.event_type}-${ev.reference_id ?? index}`}
            onPress={() => { triggerHaptic('light'); router.push('/(patient)/(tabs)/timeline'); }}
            style={({ pressed }) => [tlStyles.row, { opacity: pressed ? 0.82 : 1 }]}
          >
            {/* Spine */}
            <View style={tlStyles.spineCol}>
              <View style={[tlStyles.dot, { backgroundColor: tileInfo.ic }]}>
                <Ionicons name={tileInfo.icon} size={12} color="#FFFFFF" />
              </View>
              {!isLast ? <View style={[tlStyles.spine, { backgroundColor: colors.border }]} /> : null}
            </View>

            {/* Content */}
            <View style={[tlStyles.card, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
              <Text style={[tlStyles.date, { color: colors.textMuted }]}>
                {new Date(ev.event_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={[tlStyles.title, { color: colors.text }]} numberOfLines={2}>{title}</Text>
              {ev.summary ? (
                <Text style={[tlStyles.summary, { color: colors.textSecondary }]} numberOfLines={2}>{ev.summary}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  spineCol: { alignItems: 'center', width: 28, paddingTop: 14 },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  spine: { flex: 1, width: 2, marginTop: 4, marginBottom: -8 },
  card: { flex: 1, borderRadius: LuminaRadius.lg, padding: 14, gap: 4 },
  date: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 11 },
  title: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  summary: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, lineHeight: 18 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export function PatientHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useLuminaTheme({ role: 'patient' });
  const { user } = useSelector((s: RootState) => s.auth);
  const { guardianPatientId, activePatientId, activePatientName, switchToGuardian, switchToFamilyMember } = useActivePatient();
  const patientId = activePatientId ?? undefined;
  const [activeTab, setActiveTab] = useState<HomeTab>('today');

  // ── Queries ──
  const { data: upcomingData, isLoading: isLoadingAppts, isRefetching, refetch: refetchAppts } = useQuery({
    queryKey: ['appointments', 'upcoming', patientId],
    queryFn: () => getUpcomingAppointments(),
  });
  const { data: vitalsData } = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () => listVitals({ patient_id: patientId }),
  });
  const { data: reminders } = useQuery({
    queryKey: ['medication-reminders'],
    queryFn: getDueReminders,
  });
  const { data: lockerSummary } = useQuery({
    queryKey: ['locker-summary', patientId],
    queryFn: () => getLockerSummary(patientId),
  });
  const { data: prescriptionsData } = useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => listPrescriptions({ patient_id: patientId, page: 1 }),
  });
  const { data: timelineData } = useQuery({
    queryKey: ['timeline-home', patientId],
    queryFn: () => getHealthTimeline({ patient_id: patientId, page_size: 5 }),
  });
  const { unreadCount } = useNotifications();
  const { data: familyMembers } = useQuery({
    queryKey: ['family-members'],
    queryFn: listFamilyMembers,
    enabled: !!guardianPatientId,
  });

  const logDoseMutation = useMutation({
    mutationFn: ({ medId, scheduledFor }: { medId: number; scheduledFor: string }) =>
      logMedicationDose(medId, { scheduled_for: scheduledFor, status: 'taken' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medication-reminders'] }),
  });

  const onRefresh = () => {
    refetchAppts();
    queryClient.invalidateQueries({ queryKey: ['vitals'] });
    queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
    queryClient.invalidateQueries({ queryKey: ['locker-summary'] });
    queryClient.invalidateQueries({ queryKey: ['timeline-home'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const appt = upcomingData?.items?.[0] as any;
  const firstName = (activePatientName ?? user?.full_name ?? 'Guest').split(' ')[0];
  const activeRx = prescriptionsData?.items?.filter((p: any) => p.status !== 'cancelled').length ?? 0;
  const vitalsCount = vitalsData?.length ?? 0;
  const heartRate = vitalsData?.find((v: any) => v.vital_type === 'heart_rate')?.value ?? '—';
  const bloodPressure = vitalsData?.find((v: any) => v.vital_type === 'blood_pressure')?.value ?? '—';
  const weight = vitalsData?.find((v: any) => v.vital_type === 'weight')?.value ?? '—';
  const daysSinceVisit = (() => {
    const ev = timelineData?.items?.find((e: any) => e.event_type?.includes('appointment'));
    if (!ev) return null;
    return Math.floor((Date.now() - new Date(ev.event_at).getTime()) / 86400000);
  })();

  const selfName = stripDrPrefix(user?.full_name ?? 'You');
  const selfId = guardianPatientId;

  const handleSwitchProfile = async (memberId: number | null, memberName: string) => {
    triggerHaptic('medium');
    if (!memberId || memberId === selfId) {
      await switchToGuardian();
    } else {
      await switchToFamilyMember(memberId, memberName);
    }
    queryClient.invalidateQueries();
  };

  const TABS: { key: HomeTab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'health', label: 'Health' },
    { key: 'timeline', label: 'Timeline' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="rgba(255,255,255,0.8)" />
        }
      >
        {/* ────── Hero ────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 18 }]}>
          {/* Top row */}
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>{getTimeGreeting()}</Text>
              <Text style={styles.heroName} numberOfLines={1}>{firstName}</Text>
            </View>
            <Pressable
              style={styles.bellBtn}
              onPress={() => router.push('/(patient)/notifications')}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {/* Family avatar strip — only shown when family members exist */}
          {guardianPatientId && (familyMembers?.length ?? 0) > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarStrip}
            >
              {/* Self */}
              {(() => {
                const isActive = activePatientId === selfId || !activePatientId;
                return (
                  <Pressable
                    style={styles.avatarItem}
                    onPress={() => handleSwitchProfile(selfId, selfName)}
                    accessibilityLabel={`Switch to your profile`}
                  >
                    <View style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.22)',
                        borderWidth: isActive ? 2.5 : 0,
                        borderColor: '#FFFFFF',
                      },
                    ]}>
                      <Text style={[styles.avatarInitial, { color: isActive ? colors.coral : '#FFFFFF' }]}>
                        {selfName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.avatarLabel, { fontFamily: isActive ? LuminaFontFamily.dmSansMedium : LuminaFontFamily.dmSansRegular }]}>
                      You
                    </Text>
                    {isActive ? <View style={styles.avatarActiveDot} /> : null}
                  </Pressable>
                );
              })()}

              {/* Family members */}
              {(familyMembers ?? []).map((m: any) => {
                const memberId = m.dependent?.patient_id ?? null;
                const memberName = m.nickname || m.full_name;
                const isActive = activePatientId === memberId;
                const rc = relColor(m.relationship);
                return (
                  <Pressable
                    key={m.id}
                    style={styles.avatarItem}
                    onPress={() => memberId && handleSwitchProfile(memberId, memberName)}
                    accessibilityLabel={`Switch to ${memberName}'s profile`}
                  >
                    <View style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.22)',
                        borderWidth: isActive ? 2.5 : 0,
                        borderColor: '#FFFFFF',
                      },
                    ]}>
                      <Text style={[styles.avatarInitial, { color: isActive ? rc : '#FFFFFF' }]}>
                        {memberName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.avatarLabel, { fontFamily: isActive ? LuminaFontFamily.dmSansMedium : LuminaFontFamily.dmSansRegular }]} numberOfLines={1}>
                      {memberName.split(' ')[0]}
                    </Text>
                    {isActive ? <View style={styles.avatarActiveDot} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Spacer for floating cards */}
          <View style={{ height: 28 }} />
        </View>

        {/* ────── Floating stat cards ─────────────────────────── */}
        <View style={styles.statRow}>
          <StatChip
            icon="time-outline"
            label="Last visit"
            value={daysSinceVisit != null ? `${daysSinceVisit}d ago` : '—'}
            colors={colors}
            isDark={isDark}
          />
          <StatChip
            icon="medical-outline"
            label="Active meds"
            value={String(reminders?.length ?? 0)}
            colors={colors}
            isDark={isDark}
            accent={false}
          />
          <StatChip
            icon="calendar-outline"
            label="Next appt"
            value={formatApptDate(appt?.appointment_date)}
            accent={!!appt}
            onPress={appt ? () => router.push(`/(patient)/appointments/${appt.id}`) : undefined}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ────── Tab strip ───────────────────────────────────── */}
        <View style={styles.tabWrap}>
          <View style={[styles.tabTrack, { backgroundColor: colors.neutral100 }]}>
            {TABS.map((t) => {
              const active = activeTab === t.key;
              return (
                <Pressable
                  key={t.key}
                  style={[styles.tabBtn, active && [styles.tabBtnActive, { backgroundColor: colors.coral }]]}
                  onPress={() => { triggerHaptic('light'); setActiveTab(t.key); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[
                    styles.tabLabel,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                    active && { fontFamily: LuminaFontFamily.dmSansMedium },
                  ]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ────── Tab content ─────────────────────────────────── */}
        <View style={styles.content}>
          {activeTab === 'today' ? (
            <TodayTab
              appt={appt}
              reminders={reminders}
              isLoadingAppts={isLoadingAppts}
              logDoseMutation={logDoseMutation}
              colors={colors}
              isDark={isDark}
              router={router}
            />
          ) : activeTab === 'health' ? (
            <HealthTab
              heartRate={String(heartRate)}
              bloodPressure={String(bloodPressure)}
              weight={String(weight)}
              recordsCount={lockerSummary?.total_records ?? 0}
              activeRx={activeRx}
              upcomingCount={upcomingData?.total ?? 0}
              vitalsCount={vitalsCount}
              colors={colors}
              isDark={isDark}
              router={router}
            />
          ) : (
            <TimelineTab
              timelineData={timelineData}
              colors={colors}
              router={router}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: {
    backgroundColor: '#F05A2A',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: 0,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroGreeting: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.80)',
    marginBottom: 2,
  },
  heroName: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F04438',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F05A2A',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: LuminaFontFamily.dmSansSemiBold,
  },

  // Avatar strip (family switcher)
  avatarStrip: {
    gap: 16,
    paddingBottom: 4,
  },
  avatarItem: {
    alignItems: 'center',
    gap: 5,
    position: 'relative',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 18,
  },
  avatarLabel: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.90)',
    maxWidth: 52,
    textAlign: 'center',
  },
  avatarActiveDot: {
    position: 'absolute',
    bottom: 20,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F05A2A',
  },

  // Floating stat row
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -28,
    marginHorizontal: LuminaSpacing.xl,
    marginBottom: 20,
  },

  // Tabs
  tabWrap: {
    paddingHorizontal: LuminaSpacing.xl,
    marginBottom: 20,
  },
  tabTrack: {
    flexDirection: 'row',
    borderRadius: LuminaRadius.lg,
    padding: 4,
    gap: 4,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabBtnActive: {
    borderRadius: LuminaRadius.md,
  },

  quickActionsScroll: {
    gap: 10,
    paddingRight: LuminaSpacing.xl,
  },

  tabLabel: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
  },

  // Content
  content: {
    paddingHorizontal: LuminaSpacing.xl,
  },
});
