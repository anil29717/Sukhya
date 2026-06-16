import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatTime, getPatientDisplayName } from '../../../utils/format';

const { width } = Dimensions.get('window');

const STAT_CARD_HEIGHT = 88;
const STAT_OVERLAP = STAT_CARD_HEIGHT / 2;

// ─── API calls ────────────────────────────────────────────────────
const fetchTodayAppointments = () => apiFetch('/appointments/today');
const fetchDoctorMe = () => apiFetch('/doctors/me');

// ─── Status config ────────────────────────────────────────────────
const STATUS = {
  pending:   { color: '#F79009', bg: '#FEF3C7', label: 'Pending' },
  confirmed: { color: '#0BA5EC', bg: '#E0F2FE', label: 'Confirmed' },
  completed: { color: '#12B76A', bg: '#DCFCE7', label: 'Completed' },
  cancelled: { color: '#F04438', bg: '#FEE2E2', label: 'Cancelled' },
};

// ─── Skeleton loader ──────────────────────────────────────────────
function SkeletonBox({ width: w, height: h, radius = 8, style, colors }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useState(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  });
  return (
    <Animated.View
      style={[
        { width: w, height: h, borderRadius: radius, backgroundColor: colors.border, opacity: anim },
        style,
      ]}
    />
  );
}

// ─── Stat card ────────────────────────────────────────────────────
function StatCard({ value, label, valueColor, colors }) {
  return (
    <View style={[statStyles.card, Shadow.md, { backgroundColor: colors.surface }]}>
      <Text style={[statStyles.value, { color: valueColor ?? colors.textPrimary }]}>
        {value ?? '—'}
      </Text>
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    height: STAT_CARD_HEIGHT,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 4,
  },
  label: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 15,
  },
});

// ─── Quick action tile ────────────────────────────────────────────
function ActionTile({ icon, label, iconColor, iconBg, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[actionStyles.tile, Shadow.sm, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[actionStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <Text style={[actionStyles.label, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  tile: {
    width: (width - Spacing[5] * 2 - Spacing[3]) / 2,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  label: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});

// ─── Appointment card (dashboard mini version) ────────────────────
function AppointmentRow({ item, onPress, colors }) {
  const status = STATUS[item.status] ?? STATUS.pending;

  return (
    <TouchableOpacity
      style={[apptStyles.card, Shadow.sm, { backgroundColor: colors.surface }]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      <View style={[apptStyles.statusBar, { backgroundColor: status.color }]} />

      <View style={apptStyles.inner}>
        <View style={apptStyles.timeCol}>
          <Text style={[apptStyles.timeHour, { color: colors.textPrimary }]}>
            {item.start_time ? formatTime(item.start_time).split(' ')[0] : '--:--'}
          </Text>
          <Text style={[apptStyles.timeAmPm, { color: colors.textSecondary }]}>
            {item.start_time ? formatTime(item.start_time).split(' ')[1] : ''}
          </Text>
        </View>

        <View style={[apptStyles.vertDivider, { backgroundColor: colors.border }]} />

        <View style={apptStyles.infoCol}>
          <View style={apptStyles.nameRow}>
            <Text style={[apptStyles.patientName, { color: colors.textPrimary }]} numberOfLines={1}>
              {getPatientDisplayName(item)}
            </Text>
            <View style={[apptStyles.tokenChip, { backgroundColor: colors.tealLight }]}>
              <Text style={[apptStyles.tokenText, { color: colors.teal }]}>
                #{item.token_number ?? '—'}
              </Text>
            </View>
          </View>
          <Text style={[apptStyles.reason, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.reason ?? 'General consultation'}
          </Text>
        </View>

        <View style={apptStyles.rightCol}>
          <View style={[apptStyles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[apptStyles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginTop: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const apptStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing[2],
  },
  statusBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    gap: Spacing[3],
  },
  timeCol: {
    alignItems: 'center',
    minWidth: 40,
  },
  timeHour: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  timeAmPm: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },
  vertDivider: {
    width: 1,
    height: 36,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  patientName: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.base,
    flex: 1,
  },
  tokenChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenText: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: FontSize.xs,
  },
  reason: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
  },
});

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ text, action, onAction, colors }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{text}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.sectionAction, { color: colors.teal }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Stats row (shared between overlay and loading state) ─────────
function StatsRow({ loading, total, pending, completed, colors }) {
  if (loading) {
    return (
      <>
        <SkeletonBox width={(width - 64) / 3} height={STAT_CARD_HEIGHT} colors={colors} />
        <SkeletonBox width={(width - 64) / 3} height={STAT_CARD_HEIGHT} colors={colors} />
        <SkeletonBox width={(width - 64) / 3} height={STAT_CARD_HEIGHT} colors={colors} />
      </>
    );
  }

  return (
    <>
      <StatCard value={total}     label="Appts"     valueColor={colors.teal}    colors={colors} />
      <StatCard value={pending}   label="Pending"   valueColor={colors.warning} colors={colors} />
      <StatCard value={completed} label="Completed" valueColor={colors.success} colors={colors} />
    </>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function DoctorDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const user = useSelector((s) => s.auth.user);
  const [refreshing, setRefreshing] = useState(false);

  const { data: todayData, isLoading: loadingToday, refetch: refetchToday } =
    useQuery({ queryKey: ['appointments-today'], queryFn: fetchTodayAppointments });

  const { data: doctorMe, refetch: refetchDoctorMe } =
    useQuery({ queryKey: ['doctor-me'], queryFn: fetchDoctorMe });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchToday(), refetchDoctorMe()]);
    setRefreshing(false);
  }, [refetchToday, refetchDoctorMe]);

  const appointments = todayData?.items ?? todayData ?? [];
  const total     = appointments.length;
  const pending   = appointments.filter((a) => a.status === 'pending').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  const firstName = user?.full_name?.split(' ')[0] ?? 'Doctor';
  const specialization =
    doctorMe?.specialization ??
    user?.doctor_profile?.specialization ??
    null;

  const goToAppointmentDetail = (item) => {
    navigation.navigate('AppointmentsTab', {
      screen: 'DoctorAppointmentDetail',
      params: { appointmentId: item.id },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />

      {/* ── Header wrapper: teal header + floating stat cards ── */}
      <View style={styles.headerWrapper}>
        <View style={[styles.tealHeader, { backgroundColor: colors.teal }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greetingSub}>{greeting},</Text>
                <Text style={styles.greetingName}>Dr. {firstName}</Text>
                {specialization ? (
                  <View style={styles.specialtyChip}>
                    <Text style={styles.specialtyText}>{specialization}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.avatarBtn}
                  onPress={() => navigation.navigate('ProfileTab')}
                >
                  <Text style={styles.avatarText}>
                    {user?.full_name
                      ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'DR'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <StatsRow
              loading={loadingToday}
              total={total}
              pending={pending}
              completed={completed}
              colors={colors}
            />
          </View>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.teal}
            colors={[colors.teal]}
          />
        }
      >
        <SectionLabel
          text="Today's Schedule"
          action="View All"
          onAction={() => navigation.navigate('AppointmentsTab')}
          colors={colors}
        />

        {loadingToday ? (
          [1, 2, 3].map((i) => (
            <View key={i} style={[apptStyles.card, Shadow.sm, { backgroundColor: colors.surface, marginBottom: Spacing[2] }]}>
              <View style={[apptStyles.statusBar, { backgroundColor: colors.border }]} />
              <View style={{ flex: 1, padding: Spacing[3], gap: 8 }}>
                <SkeletonBox width={120} height={14} colors={colors} />
                <SkeletonBox width={200} height={12} colors={colors} />
              </View>
            </View>
          ))
        ) : appointments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.tealLight }]}>
              <Ionicons name="calendar-outline" size={28} color={colors.teal} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No appointments today
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Your schedule is clear. Enjoy your day!
            </Text>
          </View>
        ) : (
          appointments.slice(0, 4).map((item) => (
            <AppointmentRow
              key={item.id}
              item={item}
              onPress={goToAppointmentDetail}
              colors={colors}
            />
          ))
        )}

        <SectionLabel text="Quick Actions" colors={colors} />

        <View style={styles.actionsGrid}>
          <ActionTile
            icon="document-text-outline"
            label="New Prescription"
            iconColor="#0D9B76"
            iconBg="#E6F7F2"
            onPress={() => navigation.navigate('ClinicalTab', { screen: 'CreatePrescription' })}
            colors={colors}
          />
          <ActionTile
            icon="create-outline"
            label="Write Note"
            iconColor="#7C3AED"
            iconBg="#EDE9FE"
            onPress={() => navigation.navigate('ClinicalTab', { screen: 'CreateNote' })}
            colors={colors}
          />
          <ActionTile
            icon="people-outline"
            label="My Patients"
            iconColor="#F79009"
            iconBg="#FEF3C7"
            onPress={() => navigation.navigate('PatientsTab')}
            colors={colors}
          />
          <ActionTile
            icon="bar-chart-outline"
            label="My Analytics"
            iconColor="#076B52"
            iconBg="#E6F7F2"
            onPress={() => navigation.navigate('DoctorAnalytics')}
            colors={colors}
          />
        </View>

        <View style={{ height: Spacing[6] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  headerWrapper: {
    position: 'relative',
    zIndex: 10,
  },

  tealHeader: {
    paddingBottom: STAT_OVERLAP + Spacing[2],
    paddingHorizontal: Spacing[5],
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  greetingSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.80)',
    marginBottom: 2,
  },
  greetingName: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xl,
    lineHeight: 30,
    color: '#FFFFFF',
    marginBottom: Spacing[2],
  },
  specialtyChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  specialtyText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.90)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: Spacing[1],
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F05A2A',
    borderWidth: 1.5,
    borderColor: '#0D9B76',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  avatarText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 15,
    color: '#FFFFFF',
  },

  statsOverlay: {
    position: 'absolute',
    left: Spacing[5],
    right: Spacing[5],
    bottom: -STAT_OVERLAP,
    zIndex: 20,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },

  scroll: {
    paddingHorizontal: Spacing[5],
    paddingTop: STAT_OVERLAP + Spacing[4],
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  sectionLabel: {
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: FontSize.base,
  },
  sectionAction: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },

  emptyCard: {
    borderRadius: Radius.lg,
    padding: Spacing[6],
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  emptyTitle: {
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: FontSize.md,
    marginBottom: Spacing[1],
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
});
