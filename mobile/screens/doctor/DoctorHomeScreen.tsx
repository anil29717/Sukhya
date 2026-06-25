import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { formatTime12 } from '@/api/types';
import { getTodayAppointments } from '@/api/appointments';
import { getMyDoctorProfile } from '@/api/doctor';
import { ActionTile } from '@/components/lumina/ActionTile';
import { RootState } from '@/store/store';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const STAT_HEIGHT = 88;
const STAT_OVERLAP = STAT_HEIGHT / 2;
const H_PAD = LuminaSpacing.xl; // 20

/** Strip "Dr." title and return the actual first name for greetings. */
function getDoctorFirstName(fullName?: string | null): string {
  if (!fullName?.trim()) return 'Doctor';
  const parts = fullName.trim().split(/\s+/).filter((p) => !/^dr\.?$/i.test(p));
  return parts[0] ?? 'Doctor';
}

function getDoctorInitials(fullName?: string | null): string {
  if (!fullName?.trim()) return 'DD';
  const parts = fullName.trim().split(/\s+/).filter((p) => !/^dr\.?$/i.test(p));
  return parts.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'DD';
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: '#F79009', bg: '#FEF3C7', label: 'Pending'   },
  confirmed: { color: '#0BA5EC', bg: '#E0F2FE', label: 'Confirmed' },
  completed: { color: '#12B76A', bg: '#DCFCE7', label: 'Completed' },
  cancelled: { color: '#F04438', bg: '#FEE2E2', label: 'Cancelled' },
  scheduled: { color: '#0BA5EC', bg: '#E0F2FE', label: 'Scheduled' },
};

function getStatus(s: string) {
  return STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG.pending;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  valueColor,
  surfaceColor,
}: {
  value: number;
  label: string;
  valueColor: string;
  surfaceColor: string;
}) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  return (
    <View
      style={[
        statStyles.card,
        { backgroundColor: surfaceColor },
        Platform.OS === 'ios' ? LuminaShadow.card : null,
      ]}
    >
      <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    height: STAT_HEIGHT,
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 3,
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
  },
});

// ─── Appointment row (time | divider | name + token | status) ─────────────────

function AppointmentRow({
  item,
  onPress,
  surfaceColor,
  borderColor,
}: {
  item: { id: number; start_time?: string; patient?: { full_name?: string }; reason?: string; status: string; token_number?: number };
  onPress: () => void;
  surfaceColor: string;
  borderColor: string;
}) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const status = getStatus(item.status);

  const timeStr = item.start_time ? formatTime12(item.start_time) : '--:-- AM';
  const [timePart, periodPart] = timeStr.split(' ');

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={({ pressed }) => [
        rowStyles.card,
        { backgroundColor: surfaceColor, opacity: pressed ? 0.82 : 1 },
        Platform.OS === 'ios' ? LuminaShadow.card : null,
      ]}
    >
      {/* Left status bar */}
      <View style={[rowStyles.statusBar, { backgroundColor: status.color }]} />

      <View style={rowStyles.inner}>
        {/* Time column */}
        <View style={rowStyles.timeCol}>
          <Text style={[rowStyles.timeHour, { color: colors.text }]}>{timePart}</Text>
          <Text style={[rowStyles.timePeriod, { color: colors.textSecondary }]}>{periodPart}</Text>
        </View>

        {/* Vertical divider */}
        <View style={[rowStyles.divider, { backgroundColor: borderColor }]} />

        {/* Patient info */}
        <View style={rowStyles.infoCol}>
          <View style={rowStyles.nameRow}>
            <Text style={[rowStyles.patientName, { color: colors.text }]} numberOfLines={1}>
              {item.patient?.full_name ?? 'Patient'}
            </Text>
            {item.token_number != null ? (
              <View style={rowStyles.tokenChip}>
                <Text style={rowStyles.tokenText}>#{item.token_number}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[rowStyles.reason, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.reason ?? 'General consultation'}
          </Text>
        </View>

        {/* Status + chevron */}
        <View style={rowStyles.rightCol}>
          <View style={[rowStyles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[rowStyles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginTop: 4 }} />
        </View>
      </View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: LuminaSpacing.sm,
  },
  statusBar: { width: 4 },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: LuminaSpacing.md,
    gap: LuminaSpacing.md,
  },
  timeCol: { alignItems: 'center', minWidth: 40 },
  timeHour: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 13,
    lineHeight: 17,
  },
  timePeriod: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 10,
    marginTop: 1,
  },
  divider: { width: 1, height: 36 },
  infoCol: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  patientName: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 14,
    flex: 1,
  },
  tokenChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E6F7F2',
  },
  tokenText: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 10,
    color: '#0D9B76',
  },
  reason: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
  },
  rightCol: { alignItems: 'flex-end', gap: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 10,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DoctorHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const { user } = useSelector((s: RootState) => s.auth);

  const today = useQuery({ queryKey: ['appointments', 'today'], queryFn: getTodayAppointments });
  const doctorMe = useQuery({ queryKey: ['doctor-me'], queryFn: getMyDoctorProfile });
  const isRefreshing = today.isRefetching;

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['doctor-me'] });
  };

  const appointments = today.data?.items ?? [];
  const total     = appointments.length;
  const pending   = appointments.filter((a) => a.status === 'pending').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  const specialization = doctorMe.data?.specialization ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  const firstName = getDoctorFirstName(user?.full_name);
  const initials = getDoctorInitials(user?.full_name);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Fixed teal header + floating stat cards ── */}
      <View style={styles.headerWrapper}>
        {/* Teal block */}
        <View
          style={[
            styles.tealHeader,
            {
              backgroundColor: colors.teal,
              paddingTop: insets.top + LuminaSpacing.md,
            },
          ]}
        >
          <View style={styles.headerContent}>
            {/* Left: greeting + name + specialty */}
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingSub}>{greeting},</Text>
              <Text style={styles.greetingName}>Dr. {firstName}</Text>
              {specialization ? (
                <View style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{specialization}</Text>
                </View>
              ) : null}
            </View>

            {/* Right: avatar */}
            <Pressable
              style={styles.avatarBtn}
              onPress={() => router.push('/(doctor)/(tabs)/profile' as never)}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          </View>
        </View>

        {/* Floating stat cards — absolutely overlapping */}
        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <StatCard
              value={today.isLoading ? 0 : total}
              label="Appts"
              valueColor={colors.teal}
              surfaceColor={colors.surface}
            />
            <StatCard
              value={today.isLoading ? 0 : pending}
              label="Pending"
              valueColor="#F79009"
              surfaceColor={colors.surface}
            />
            <StatCard
              value={today.isLoading ? 0 : completed}
              label="Completed"
              valueColor="#12B76A"
              surfaceColor={colors.surface}
            />
          </View>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.teal}
          />
        }
      >
        {/* Today's Schedule */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Today's Schedule</Text>
          <Pressable onPress={() => router.push('/(doctor)/(tabs)/appointments' as never)}>
            <Text style={[styles.sectionAction, { color: colors.teal }]}>View All</Text>
          </Pressable>
        </View>

        {today.isLoading ? (
          // Skeleton rows
          [1, 2, 3].map((i) => (
            <View key={i} style={[rowStyles.card, { backgroundColor: colors.surface, marginBottom: LuminaSpacing.sm }]}>
              <View style={[rowStyles.statusBar, { backgroundColor: colors.borderSubtle }]} />
              <View style={{ flex: 1, padding: LuminaSpacing.md, gap: 8 }}>
                <View style={[styles.skeletonLine, { width: 120, backgroundColor: colors.borderSubtle }]} />
                <View style={[styles.skeletonLine, { width: 200, height: 10, backgroundColor: colors.borderSubtle }]} />
              </View>
            </View>
          ))
        ) : appointments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.tealSoft }]}>
              <Ionicons name="calendar-outline" size={28} color={colors.teal} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No appointments today</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Your schedule is clear. Enjoy your day!
            </Text>
          </View>
        ) : (
          appointments.slice(0, 5).map((item) => (
            <AppointmentRow
              key={item.id}
              item={item as any}
              onPress={() => router.push(`/(doctor)/appointments/${item.id}` as never)}
              surfaceColor={colors.surface}
              borderColor={colors.border}
            />
          ))
        )}

        {/* Quick Actions */}
        <View style={[styles.sectionRow, { marginTop: LuminaSpacing.lg }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          <ActionTile
            icon="document-text-outline"
            label="New Prescription"
            iconColor="#0D9B76"
            iconBg="#E6F7F2"
            onPress={() => router.push('/(doctor)/prescriptions/create' as never)}
            role="doctor"
          />
          <ActionTile
            icon="create-outline"
            label="Write Note"
            iconColor="#7C3AED"
            iconBg="#EDE9FE"
            onPress={() => router.push('/(doctor)/notes/create' as never)}
            role="doctor"
          />
          <ActionTile
            icon="people-outline"
            label="My Patients"
            iconColor="#F79009"
            iconBg="#FEF3C7"
            onPress={() => router.push('/(doctor)/(tabs)/patients' as never)}
            role="doctor"
          />
          <ActionTile
            icon="bar-chart-outline"
            label="My Analytics"
            iconColor="#076B52"
            iconBg="#E6F7F2"
            onPress={() => router.push('/(doctor)/profile/analytics' as never)}
            role="doctor"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Header ──
  headerWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  tealHeader: {
    paddingHorizontal: H_PAD,
    paddingBottom: STAT_OVERLAP + LuminaSpacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: LuminaSpacing.sm,
    paddingBottom: LuminaSpacing.md,
  },
  greetingSub: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 2,
  },
  greetingName: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    marginBottom: LuminaSpacing.sm,
  },
  specialtyChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  specialtyText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  avatarText: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 15,
    color: '#FFFFFF',
  },

  // ── Floating stat cards ──
  statsOverlay: {
    position: 'absolute',
    left: H_PAD,
    right: H_PAD,
    bottom: -STAT_OVERLAP,
    zIndex: 20,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: LuminaSpacing.sm,
  },

  // ── Scroll body ──
  scroll: {
    paddingHorizontal: H_PAD,
    paddingTop: STAT_OVERLAP + LuminaSpacing.lg,
  },

  // ── Section headers ──
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: LuminaSpacing.md,
    marginTop: LuminaSpacing.xs,
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 15,
  },
  sectionAction: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
  },

  // ── Empty state ──
  emptyCard: {
    borderRadius: LuminaRadius.xl,
    paddingVertical: 36,
    paddingHorizontal: LuminaSpacing.xl,
    alignItems: 'center',
    marginBottom: LuminaSpacing.xl,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LuminaSpacing.md,
  },
  emptyTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 16,
    marginBottom: LuminaSpacing.xs,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Quick actions ──
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LuminaSpacing.md,
    marginBottom: LuminaSpacing.xl,
  },

  // ── Skeleton ──
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
