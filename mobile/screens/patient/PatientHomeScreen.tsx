import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { formatDoctorName } from '@/api/types';
import { getUpcomingAppointments } from '@/api/appointments';
import { getDueReminders, listVitals, logMedicationDose } from '@/api/medications';
import { listPrescriptions } from '@/api/prescriptions';
import { getHealthTimeline } from '@/api/timeline';
import { getLockerSummary, getNotifications } from '@/api/family';
import { getMyPatientProfile } from '@/api/patients';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { FamilySwitcher } from '@/components/lumina/FamilySwitcher';
import { HealthScoreCard, computeHealthScore } from '@/components/lumina/HealthScoreCard';
import { QuickInsights } from '@/components/lumina/QuickInsights';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { MetricCard as SummaryMetricCard } from '@/components/lumina/MetricCard';
import { SectionLabel } from '@/components/lumina/SectionLabel';
import { StatusBadge } from '@/components/lumina/LuminaButton';
import { useActivePatient } from '@/hooks/useActivePatient';
import { RootState } from '@/store/store';
import { LuminaRadius, LuminaSpacing, LuminaTypography, getTimeGreeting } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const QUICK_ACTIONS = [
  { icon: 'calendar-outline' as const, label: 'Book Appointment', route: '/(patient)/(tabs)/doctors' as const },
  { icon: 'cloud-upload-outline' as const, label: 'Upload Record', route: '/(patient)/(tabs)/records' as const },
  { icon: 'medkit-outline' as const, label: 'View Prescriptions', route: '/(patient)/prescriptions' as const },
  { icon: 'pulse-outline' as const, label: 'Add Vitals', route: '/(patient)/vitals/add' as const },
];

export function PatientHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { user } = useSelector((s: RootState) => s.auth);
  const { activePatientId } = useActivePatient();
  const patientId = activePatientId ?? undefined;

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
    queryFn: () => getHealthTimeline({ patient_id: patientId, page_size: 3 }),
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => getNotifications(1),
  });

  const { data: patientProfile } = useQuery({
    queryKey: ['patient-me'],
    queryFn: getMyPatientProfile,
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
  };

  const appt = upcomingData?.items?.[0];
  const displayName = user?.full_name?.split(' ')[0] ?? 'Guest';
  const heartRate = vitalsData?.find((v) => v.vital_type === 'heart_rate')?.value ?? '—';
  const bloodPressure = vitalsData?.find((v) => v.vital_type === 'blood_pressure')?.value ?? '—';
  const weight = vitalsData?.find((v) => v.vital_type === 'weight')?.value ?? '—';
  const unreadCount = notificationsData?.total ?? 0;

  const formatTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1]?.slice(0, 2) ?? '00';
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return { hour: `${hour}:${minute}`, period };
  };

  const formatDateDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'TODAY';
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const apptTime = appt ? formatTime(appt.start_time) : null;
  const activeRx = prescriptionsData?.items?.filter((p) => p.status !== 'cancelled').length ?? 0;
  const vitalsCount = vitalsData?.length ?? 0;
  const { score, profileComplete } = computeHealthScore({
    hasDob: !!patientProfile?.date_of_birth,
    hasBloodGroup: !!patientProfile?.blood_group,
    hasEmergency: !!patientProfile?.emergency_contact_name,
    recordsCount: lockerSummary?.total_records ?? 0,
    vitalsCount,
    appointmentsCount: upcomingData?.total ?? 0,
  });

  const daysSinceVisit = (() => {
    const completed = timelineData?.items?.find((e) => e.event_type.includes('appointment'));
    if (!completed) return null;
    const diff = Math.floor((Date.now() - new Date(completed.event_at).getTime()) / 86400000);
    return diff;
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <FamilySwitcher />

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getTimeGreeting()}</Text>
              <Text style={[styles.displayName, { color: colors.text }]} accessibilityRole="header">
                {displayName}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.bellBtn, { backgroundColor: colors.surfaceElevated }, styles.elevated]}
            onPress={() => router.push('/(patient)/notifications')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeCount}>{Math.min(unreadCount, 9)}{unreadCount > 9 ? '+' : ''}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <HealthScoreCard
          score={score}
          profileComplete={profileComplete}
          recordsCount={lockerSummary?.total_records ?? 0}
          vitalsCount={vitalsCount}
          appointmentsCount={upcomingData?.total ?? 0}
        />

        <QuickInsights
          items={[
            {
              icon: 'calendar-outline',
              label: 'Last visit',
              value: daysSinceVisit != null ? `${daysSinceVisit}d ago` : '—',
              tint: 'secondary',
            },
            {
              icon: 'medkit-outline',
              label: 'Active meds',
              value: String(reminders?.length ?? 0),
              tint: 'accent',
            },
            {
              icon: 'time-outline',
              label: 'Next appt',
              value: appt ? 'Scheduled' : 'None',
              tint: appt ? 'primary' : 'warning',
            },
          ]}
        />

        {isLoadingAppts ? (
          <LoadingSkeleton count={1} />
        ) : appt ? (
          <Pressable onPress={() => router.push(`/(patient)/appointments/${appt.id}`)}>
            <LuminaCard elevated style={styles.appointmentCard}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>UPCOMING VISIT</Text>
              <View style={styles.appointmentRow}>
                <View style={[styles.timeBlock, { backgroundColor: colors.accentBlue }]}>
                  <Text style={[styles.timeDay, { color: colors.text }]}>{formatDateDay(appt.appointment_date)}</Text>
                  <Text style={[styles.timeHour, { color: colors.text }]}>{apptTime?.hour}</Text>
                  <Text style={[styles.timePeriod, { color: colors.text }]}>{apptTime?.period}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={[styles.doctorName, { color: colors.text }]}>{formatDoctorName(appt.doctor?.full_name)}</Text>
                  <Text style={[styles.specialty, { color: colors.textSecondary }]}>{appt.reason ?? 'Consultation'}</Text>
                  <StatusBadge status={appt.status} />
                </View>
              </View>
            </LuminaCard>
          </Pressable>
        ) : (
          <LuminaCard elevated style={styles.appointmentCard}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>UPCOMING VISIT</Text>
            <Text style={[styles.specialty, { color: colors.textSecondary }]}>No visits scheduled yet.</Text>
            <Pressable style={[styles.linkBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(patient)/(tabs)/doctors')}>
              <Text style={[styles.linkBtnText, { color: colors.onPrimary }]}>Book Appointment</Text>
            </Pressable>
          </LuminaCard>
        )}

        <SectionLabel title="Quick actions" />
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={[styles.quickAction, { backgroundColor: colors.surfaceElevated }, styles.elevated]}
              onPress={() => router.push(action.route)}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={action.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {reminders && reminders.length > 0 ? (
          <>
            <SectionLabel title="ACTIVE MEDICATIONS" />
            {reminders.slice(0, 3).map((r) => (
              <View key={`${r.medication_id}-${r.scheduled_for}`} style={[styles.medRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.medName, { color: colors.text }]}>{r.medication_name}</Text>
                  <Text style={[styles.medTime, { color: colors.textSecondary }]}>
                    {new Date(r.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Pressable
                  style={[styles.takenBtn, { backgroundColor: colors.accentMint }]}
                  onPress={() => logDoseMutation.mutate({ medId: r.medication_id, scheduledFor: r.scheduled_for })}
                >
                  <Text style={[styles.takenBtnText, { color: colors.accentMintText }]}>Taken</Text>
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => router.push('/(patient)/medications')}>
              <Text style={[styles.seeAll, { color: colors.accentTeal }]}>View all medications →</Text>
            </Pressable>
          </>
        ) : null}

        <SectionLabel title="HEALTH SUMMARY" />
        <View style={styles.summaryGrid}>
          <SummaryMetricCard icon="folder-outline" label="Total Records" value={lockerSummary?.total_records ?? 0} onPress={() => router.push('/(patient)/(tabs)/records')} />
          <SummaryMetricCard icon="medkit-outline" label="Prescriptions" value={activeRx} onPress={() => router.push('/(patient)/prescriptions')} />
          <SummaryMetricCard icon="calendar-outline" label="Upcoming" value={upcomingData?.total ?? 0} onPress={() => router.push('/(patient)/appointments')} />
          <SummaryMetricCard icon="heart-outline" label="Heart Rate" value={heartRate} onPress={() => router.push('/(patient)/vitals')} />
        </View>

        <View style={styles.metricsStack}>
          <VitalRow icon="heart" iconColor="#EF4444" iconBg={colors.accentRed} label="Blood Pressure" value={bloodPressure} colors={colors} />
          <VitalRow icon="barbell-outline" iconColor="#3B82F6" iconBg={colors.accentBlue} label="Weight" value={weight === '—' ? '—' : `${weight} kg`} colors={colors} />
        </View>

        <SectionLabel title="RECENT TIMELINE" />
        {timelineData?.items?.length ? (
          timelineData.items.map((ev) => (
            <Pressable key={`${ev.event_type}-${ev.reference_id}`} style={styles.activityItem} onPress={() => router.push('/(patient)/(tabs)/timeline')}>
              <View style={[styles.activityDot, { backgroundColor: colors.tabActive }]} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityTime, { color: colors.textMuted }]}>{new Date(ev.event_at).toLocaleDateString()}</Text>
                <Text style={[styles.activityTitle, { color: colors.text }]}>{ev.title}</Text>
                {ev.summary ? <Text style={[styles.activityDetail, { color: colors.textSecondary }]}>{ev.summary}</Text> : null}
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={[styles.emptyTimeline, { color: colors.textMuted }]}>No recent health events.</Text>
        )}

        <LinearGradient colors={[colors.wellnessGradientStart, colors.wellnessGradientEnd]} style={styles.wellnessCard}>
          <Text style={styles.wellnessTitle}>Health Tip</Text>
          <Text style={styles.wellnessBody}>Stay hydrated and log your vitals regularly for better insights into your health trends.</Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

function VitalRow({ icon, iconColor, iconBg, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string; label: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.metricText}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.lg, paddingTop: LuminaSpacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: LuminaSpacing.xl },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  greeting: { ...LuminaTypography.bodySmall },
  displayName: { ...LuminaTypography.display, fontSize: 26 },
  elevated: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bellBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeCount: { color: '#fff', fontSize: 9, fontWeight: '700' },
  appointmentCard: { marginBottom: LuminaSpacing.lg },
  cardLabel: { ...LuminaTypography.label, marginBottom: LuminaSpacing.md },
  appointmentRow: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md },
  timeBlock: { borderRadius: LuminaRadius.md, padding: LuminaSpacing.md, alignItems: 'center', minWidth: 64 },
  timeDay: { fontSize: 10, fontWeight: '700' },
  timeHour: { fontSize: 18, fontWeight: '700' },
  timePeriod: { fontSize: 11 },
  appointmentInfo: { flex: 1, gap: 4 },
  doctorName: { ...LuminaTypography.h3 },
  specialty: { ...LuminaTypography.bodySmall },
  linkBtn: { marginTop: LuminaSpacing.md, paddingVertical: 10, borderRadius: LuminaRadius.md, alignItems: 'center' },
  linkBtnText: { fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.lg },
  quickAction: { width: '48%', padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, gap: LuminaSpacing.sm },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickActionText: { ...LuminaTypography.bodySmall, fontWeight: '600' },
  medRow: { flexDirection: 'row', alignItems: 'center', padding: LuminaSpacing.md, borderRadius: LuminaRadius.lg, borderWidth: 1, marginBottom: LuminaSpacing.sm },
  medName: { ...LuminaTypography.h3 },
  medTime: { ...LuminaTypography.bodySmall },
  takenBtn: { paddingHorizontal: LuminaSpacing.md, paddingVertical: LuminaSpacing.sm, borderRadius: LuminaRadius.md },
  takenBtnText: { fontWeight: '700', fontSize: 12 },
  seeAll: { fontWeight: '600', marginBottom: LuminaSpacing.lg },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.lg },
  metricsStack: { gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.lg },
  metricCard: { flexDirection: 'row', alignItems: 'center', borderRadius: LuminaRadius.lg, padding: LuminaSpacing.lg, borderWidth: 1, gap: LuminaSpacing.md },
  metricIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  metricText: { flex: 1 },
  metricLabel: { ...LuminaTypography.label },
  metricValue: { ...LuminaTypography.h3 },
  activityItem: { flexDirection: 'row', gap: LuminaSpacing.md, marginBottom: LuminaSpacing.lg },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  activityContent: { flex: 1 },
  activityTime: { ...LuminaTypography.label, marginBottom: 2 },
  activityTitle: { ...LuminaTypography.body, fontWeight: '500' },
  activityDetail: { ...LuminaTypography.bodySmall, marginTop: 4 },
  emptyTimeline: { ...LuminaTypography.bodySmall, marginBottom: LuminaSpacing.lg },
  wellnessCard: { borderRadius: LuminaRadius.lg, padding: LuminaSpacing.xl, marginTop: LuminaSpacing.md, marginBottom: LuminaSpacing.xxl },
  wellnessTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: LuminaSpacing.sm },
  wellnessBody: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
});
