import { Ionicons } from '@expo/vector-icons';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { formatDoctorName, formatTime12 } from '@/api/types';
import { getTodayAppointments, getUpcomingAppointments } from '@/api/appointments';
import { getDoctorAnalytics } from '@/api/doctor';
import { getNotifications } from '@/api/family';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { MetricCard } from '@/components/lumina/MetricCard';
import { LuminaButton, StatusBadge } from '@/components/lumina/LuminaButton';
import { SectionLabel } from '@/components/lumina/SectionLabel';
import { RootState } from '@/store/store';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography, getTimeGreeting } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const QUICK_ACTIONS = [
  { icon: 'calendar-outline' as const, label: 'Schedule', route: '/(doctor)/(tabs)/schedule' as const },
  { icon: 'people-outline' as const, label: 'Patients', route: '/(doctor)/(tabs)/patients' as const },
  { icon: 'medkit-outline' as const, label: 'Prescription', route: '/(doctor)/prescriptions/create' as const },
  { icon: 'arrow-redo-outline' as const, label: 'Follow-ups', route: '/(doctor)/follow-ups' as const },
];

export function DoctorHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { user } = useSelector((s: RootState) => s.auth);

  const analytics = useQuery({ queryKey: ['doctor-analytics'], queryFn: () => getDoctorAnalytics(30) });
  const today = useQuery({ queryKey: ['appointments', 'today'], queryFn: getTodayAppointments });
  const upcoming = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: () => getUpcomingAppointments(1) });
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => getNotifications(1) });

  const isLoading = analytics.isLoading || today.isLoading;
  const isRefetching = analytics.isRefetching || today.isRefetching;

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['doctor-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const stats = analytics.data;
  const todayItems = today.data?.items ?? [];
  const upcomingItems = (upcoming.data?.items ?? []).slice(0, 3);
  const displayName = formatDoctorName(user?.full_name, 'Doctor');
  const unread = notifications.data?.total ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.md }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getTimeGreeting()}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/(doctor)/notifications' as never)}
          style={[styles.notifBtn, { backgroundColor: colors.surface }]}
          accessibilityLabel={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unread > 0 ? <View style={[styles.badge, { backgroundColor: colors.error }]} /> : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <>
            <View style={styles.metricsRow}>
              <MetricCard
                icon="today-outline"
                label="Today"
                value={stats?.appointments_today ?? todayItems.length}
                onPress={() => router.push('/(doctor)/(tabs)/appointments')}
              />
              <MetricCard
                icon="calendar-outline"
                label="Upcoming"
                value={upcoming.data?.total ?? 0}
                onPress={() => router.push('/(doctor)/(tabs)/appointments')}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                icon="people-outline"
                label="Patients"
                value={stats?.total_patients ?? 0}
                onPress={() => router.push('/(doctor)/(tabs)/patients')}
              />
              <MetricCard
                icon="arrow-redo-outline"
                label="Follow-ups"
                value={stats?.pending_follow_ups ?? 0}
                onPress={() => router.push('/(doctor)/follow-ups' as never)}
              />
            </View>

            <SectionLabel title="Today's schedule" />
            {todayItems.length === 0 ? (
              <LuminaCard elevated>
                <EmptyState icon="sunny-outline" title="Clear schedule" message="No appointments today — enjoy the focus time." />
              </LuminaCard>
            ) : (
              <LuminaCard elevated style={styles.scheduleCard}>
                {todayItems.map((appt, idx) => (
                  <Pressable
                    key={appt.id}
                    onPress={() => {
                      triggerHaptic('light');
                      router.push(`/(doctor)/appointments/${appt.id}` as never);
                    }}
                    style={[
                      styles.timelineRow,
                      idx < todayItems.length - 1 && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.timePill, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.timeText, { color: colors.primary }]}>{formatTime12(appt.start_time)}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.patientName, { color: colors.text }]}>{appt.patient?.full_name ?? 'Patient'}</Text>
                      <StatusBadge status={appt.status} />
                      {appt.reason ? (
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                          {appt.reason}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                ))}
              </LuminaCard>
            )}

            <SectionLabel title="Upcoming patients" />
            {upcomingItems.length === 0 ? (
              <LuminaCard elevated>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: LuminaSpacing.md }}>
                  No upcoming appointments
                </Text>
              </LuminaCard>
            ) : (
              upcomingItems.map((appt) => (
                <Pressable
                  key={appt.id}
                  onPress={() => router.push(`/(doctor)/appointments/${appt.id}` as never)}
                >
                  <LuminaCard elevated style={styles.listCard}>
                    <View style={styles.cardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.patientName, { color: colors.text }]}>{appt.patient?.full_name ?? 'Patient'}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                          {appt.appointment_date} · {formatTime12(appt.start_time)}
                        </Text>
                      </View>
                      <StatusBadge status={appt.status} />
                    </View>
                  </LuminaCard>
                </Pressable>
              ))
            )}

            <SectionLabel title="Quick actions" />
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((action) => (
                <Pressable
                  key={action.label}
                  style={[styles.quickBtn, { backgroundColor: colors.surfaceElevated }, LuminaShadow.sm]}
                  onPress={() => {
                    triggerHaptic('light');
                    router.push(action.route as never);
                  }}
                >
                  <View style={[styles.quickIcon, { backgroundColor: colors.secondarySoft }]}>
                    <Ionicons name={action.icon} size={20} color={colors.secondary} />
                  </View>
                  <Text style={[styles.quickLabel, { color: colors.text }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <LuminaButton
              label="New prescription"
              icon="medkit-outline"
              onPress={() => router.push('/(doctor)/prescriptions/create' as never)}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.lg,
    paddingBottom: LuminaSpacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700' },
  greeting: { ...LuminaTypography.overline, textTransform: 'none', letterSpacing: 0, fontSize: 13 },
  name: { ...LuminaTypography.h2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 100, gap: LuminaSpacing.md },
  metricsRow: { flexDirection: 'row', gap: LuminaSpacing.md },
  scheduleCard: { padding: 0, overflow: 'hidden' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', padding: LuminaSpacing.lg, gap: LuminaSpacing.md },
  timePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: LuminaRadius.md },
  timeText: { fontSize: 12, fontWeight: '700' },
  timelineContent: { flex: 1 },
  patientName: { ...LuminaTypography.label, fontSize: 15, fontWeight: '600' },
  listCard: { marginBottom: LuminaSpacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: LuminaSpacing.sm },
  quickBtn: {
    width: '47%',
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
    alignItems: 'flex-start',
    gap: LuminaSpacing.sm,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 14, fontWeight: '600' },
});
