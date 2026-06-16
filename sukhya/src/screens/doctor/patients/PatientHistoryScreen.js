import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatShortDate, formatFullDate, formatTime } from '../../../utils/format';

// ─── API ──────────────────────────────────────────────────────────
const fetchHistory = (patientId) =>
  apiFetch(`/doctors/me/patients/${patientId}/history`);

// ─── Status config ────────────────────────────────────────────────
const STATUS = {
  completed: { color: '#12B76A', bg: '#DCFCE7', label: 'Completed' },
  cancelled: { color: '#F04438', bg: '#FEE2E2', label: 'Cancelled' },
  pending:   { color: '#F79009', bg: '#FEF3C7', label: 'Pending' },
  confirmed: { color: '#0BA5EC', bg: '#E0F2FE', label: 'Confirmed' },
};

// ─── Visit card ───────────────────────────────────────────────────
function VisitCard({ item, onPress, colors }) {
  const status = STATUS[item.status] ?? STATUS.completed;
  const [expanded, setExpanded] = useState(false);

  const hasDiagnosis   = !!item.diagnosis;
  const hasPrescription = item.prescription_medications?.length > 0;
  const hasNotes       = !!item.doctor_note;
  const hasRecords     = item.records_count > 0;

  return (
    <TouchableOpacity
      style={[visitStyles.card, Shadow.sm, { backgroundColor: colors.surface }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.88}
    >
      {/* Top row */}
      <View style={visitStyles.topRow}>
        <View style={visitStyles.leftCol}>
          <Text style={[visitStyles.date, { color: colors.textPrimary }]}>
            {item.appointment_date ? formatShortDate(item.appointment_date) : '—'}
          </Text>
          {item.start_time && (
            <Text style={[visitStyles.time, { color: colors.textSecondary }]}>
              {formatTime(item.start_time)}
            </Text>
          )}
        </View>

        <View style={visitStyles.centerCol}>
          <Text style={[visitStyles.reason, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.reason ?? 'General consultation'}
          </Text>
          <Text style={[visitStyles.duration, { color: colors.textSecondary }]}>30 min</Text>
        </View>

        <View style={visitStyles.rightCol}>
          <View style={[visitStyles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[visitStyles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textSecondary}
            style={{ marginTop: 4 }}
          />
        </View>
      </View>

      {/* Expanded content */}
      {expanded && (
        <View style={[visitStyles.expanded, { borderTopColor: colors.border }]}>
          {hasDiagnosis && (
            <View style={visitStyles.expandRow}>
              <Ionicons name="medical-outline" size={14} color={colors.teal} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={[visitStyles.expandLabel, { color: colors.textSecondary }]}>Diagnosis</Text>
                <Text style={[visitStyles.expandValue, { color: colors.textPrimary }]}>
                  {item.diagnosis}
                </Text>
              </View>
            </View>
          )}

          {hasPrescription && (
            <View style={visitStyles.expandRow}>
              <Ionicons name="document-text-outline" size={14} color="#12B76A" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={[visitStyles.expandLabel, { color: colors.textSecondary }]}>Prescribed</Text>
                <Text style={[visitStyles.expandValue, { color: '#12B76A' }]}>
                  {item.prescription_medications.map((m) => m.name).join(', ')}
                </Text>
              </View>
            </View>
          )}

          {hasNotes && (
            <View style={visitStyles.expandRow}>
              <Ionicons name="create-outline" size={14} color="#7C3AED" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={[visitStyles.expandLabel, { color: colors.textSecondary }]}>Notes</Text>
                <Text
                  style={[visitStyles.expandValue, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.doctor_note}
                </Text>
              </View>
            </View>
          )}

          {hasRecords && (
            <View style={visitStyles.expandRow}>
              <Ionicons name="attach-outline" size={14} color="#0BA5EC" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={[visitStyles.expandLabel, { color: colors.textSecondary }]}>Records</Text>
                <Text style={[visitStyles.expandValue, { color: '#0BA5EC' }]}>
                  {item.records_count} {item.records_count === 1 ? 'record' : 'records'} attached
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[visitStyles.viewBtn]}
            onPress={() => onPress(item)}
          >
            <Text style={[visitStyles.viewBtnText, { color: colors.teal }]}>
              View full details →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const visitStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  leftCol: {
    minWidth: 64,
    alignItems: 'center',
  },
  date: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: 2,
  },
  time: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  centerCol: {
    flex: 1,
  },
  reason: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.base,
    marginBottom: 2,
  },
  duration: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
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
  expanded: {
    borderTopWidth: 1,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  expandRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  expandLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    marginBottom: 2,
  },
  expandValue: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  viewBtn: {
    paddingTop: Spacing[2],
    alignSelf: 'flex-end',
  },
  viewBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
});

// ─── Year group header ────────────────────────────────────────────
function YearHeader({ year, colors }) {
  return (
    <View style={[yearStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[yearStyles.text, { color: colors.textSecondary }]}>{year}</Text>
      <View style={[yearStyles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const yearStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
  },
  text: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },
  line: { flex: 1, height: 1 },
});

// ─── Group by year ────────────────────────────────────────────────
function groupByYear(appointments) {
  const groups = {};
  appointments.forEach((a) => {
    const year = a.appointment_date
      ? new Date(a.appointment_date).getFullYear()
      : 'Unknown';
    if (!groups[year]) groups[year] = [];
    groups[year].push(a);
  });
  // Sort years descending
  return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ colors }) {
  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.icon, { backgroundColor: colors.tealLight }]}>
        <Ionicons name="time-outline" size={32} color={colors.teal} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.textPrimary }]}>
        No appointment history
      </Text>
      <Text style={[emptyStyles.body, { color: colors.textSecondary }]}>
        No previous appointments with this patient.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing[12], paddingHorizontal: Spacing[8] },
  icon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4] },
  title: { fontFamily: FontFamily.nunitoSemiBold, fontSize: FontSize.md, marginBottom: Spacing[2], textAlign: 'center' },
  body: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function PatientHistoryScreen({ navigation, route }) {
  const { patientId } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: () => fetchHistory(patientId),
    enabled: !!patientId,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const history = data?.appointments ?? data?.items ?? data ?? [];
  const patientName = data?.patient_name ?? route.params?.patientName ?? 'Patient';
  const totalVisits = history.length;
  const firstVisit = history.length > 0
    ? formatShortDate(history[history.length - 1]?.appointment_date)
    : '—';
  const lastVisit = history.length > 0
    ? formatShortDate(history[0]?.appointment_date)
    : '—';

  const yearGroups = groupByYear(history);

  const handleViewDetail = (item) => {
    navigation.navigate('AppointmentsTab', {
      screen: 'DoctorAppointmentDetail',
      params: { appointmentId: item.id },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {patientName}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Appointment history with you
          </Text>
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView
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
          {/* Summary strip */}
          {history.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.tealLight }]}>
              {[
                { value: String(totalVisits), label: 'Total Visits' },
                { value: firstVisit,          label: 'First Visit' },
                { value: lastVisit,           label: 'Last Visit' },
              ].map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.summaryItem,
                    i < 2 && { borderRightColor: colors.teal + '30', borderRightWidth: 1 },
                  ]}
                >
                  <Text style={[styles.summaryValue, { color: colors.teal }]}>{s.value}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.tealDark ?? colors.teal }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* History list */}
          {history.length === 0 ? (
            <EmptyState colors={colors} />
          ) : (
            yearGroups.map(([year, items]) => (
              <View key={year}>
                <YearHeader year={year} colors={colors} />
                {items.map((item) => (
                  <VisitCard
                    key={item.id}
                    item={item}
                    onPress={handleViewDetail}
                    colors={colors}
                  />
                ))}
              </View>
            ))
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    gap: Spacing[2],
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.nunitoBold, fontSize: 17, marginBottom: 1 },
  headerSub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  exportBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },

  summaryCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    marginBottom: Spacing[5],
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  summaryValue: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: 20,
    marginBottom: 3,
  },
  summaryLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },
});