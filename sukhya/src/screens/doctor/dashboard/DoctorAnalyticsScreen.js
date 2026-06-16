import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - Spacing[5] * 2 - Spacing[4] * 2;

// ─── API ──────────────────────────────────────────────────────────
const fetchAnalytics = (days) => apiFetch(`/doctors/me/analytics?days=${days}`);

// ─── Range picker ─────────────────────────────────────────────────
function RangePicker({ active, onChange, colors }) {
  const opts = [
    { label: '7D',  value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ];
  return (
    <View style={[rpS.wrap, { backgroundColor: colors.neutral100 ?? '#F1F3F5' }]}>
      {opts.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[rpS.btn, active === o.value && { backgroundColor: colors.teal }]}
          onPress={() => onChange(o.value)}
          activeOpacity={0.8}
        >
          <Text style={[rpS.text, { color: active === o.value ? '#FFFFFF' : colors.textSecondary }]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const rpS = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: Radius.md, padding: 4 },
  btn: { flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
});

// ─── Stat card ────────────────────────────────────────────────────
function StatCard({ value, label, icon, iconColor, iconBg, delta, colors }) {
  const isPositive = delta > 0;
  return (
    <View style={[stS.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      <View style={[stS.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[stS.value, { color: colors.textPrimary }]}>{value ?? '—'}</Text>
      <Text style={[stS.label, { color: colors.textSecondary }]}>{label}</Text>
      {delta !== undefined && (
        <View style={stS.deltaRow}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={12}
            color={isPositive ? '#12B76A' : '#F04438'}
          />
          <Text style={[stS.delta, { color: isPositive ? '#12B76A' : '#F04438' }]}>
            {Math.abs(delta)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const stS = StyleSheet.create({
  card: { flex: 1, borderRadius: Radius.lg, padding: Spacing[4], alignItems: 'flex-start' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3] },
  value: { fontFamily: FontFamily.dmMonoMedium, fontSize: 24, lineHeight: 30, marginBottom: 4 },
  label: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, lineHeight: 16 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  delta: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs },
});

// ─── Simple bar chart ─────────────────────────────────────────────
function BarChart({ data, colors }) {
  if (!data || data.length === 0) return (
    <View style={bcS.empty}>
      <Text style={[bcS.emptyText, { color: colors.textSecondary }]}>No data for this period</Text>
    </View>
  );

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const barWidth = (CHART_WIDTH - (data.length - 1) * 6) / data.length;

  return (
    <View style={bcS.wrap}>
      {/* Bars */}
      <View style={bcS.barsRow}>
        {data.map((d, i) => {
          const heightPct = d.count / maxVal;
          const barH = Math.max(heightPct * 140, 4);
          return (
            <View key={i} style={[bcS.barCol, { width: barWidth }]}>
              <Text style={[bcS.barValue, { color: colors.textSecondary }]}>
                {d.count > 0 ? d.count : ''}
              </Text>
              <View
                style={[
                  bcS.bar,
                  { height: barH, backgroundColor: colors.teal, borderRadius: Math.min(barWidth / 2, 6) },
                ]}
              />
              <Text style={[bcS.barLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const bcS = StyleSheet.create({
  wrap: { paddingTop: Spacing[2] },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 180 },
  barCol: { alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barValue: { fontFamily: FontFamily.dmMonoMedium, fontSize: 10 },
  bar: { width: '100%' },
  barLabel: { fontFamily: FontFamily.dmSansRegular, fontSize: 9, textAlign: 'center' },
  empty: { height: 100, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },
});

// ─── Status breakdown bar ─────────────────────────────────────────
function StatusBar2({ completed, cancelled, pending, total, colors }) {
  if (total === 0) return null;
  const compPct = (completed / total) * 100;
  const cancPct = (cancelled / total) * 100;
  const pendPct = (pending / total) * 100;

  return (
    <View>
      <View style={sbS.bar}>
        {compPct > 0 && <View style={[sbS.seg, { flex: compPct, backgroundColor: '#12B76A' }]} />}
        {cancPct > 0 && <View style={[sbS.seg, { flex: cancPct, backgroundColor: '#F04438' }]} />}
        {pendPct > 0 && <View style={[sbS.seg, { flex: pendPct, backgroundColor: '#F79009' }]} />}
      </View>
      <View style={sbS.legend}>
        {[
          { label: 'Completed', color: '#12B76A', count: completed },
          { label: 'Cancelled', color: '#F04438', count: cancelled },
          { label: 'Pending',   color: '#F79009', count: pending },
        ].map((s) => (
          <View key={s.label} style={sbS.legendItem}>
            <View style={[sbS.dot, { backgroundColor: s.color }]} />
            <Text style={[sbS.legendText, { color: colors.textSecondary }]}>
              {s.label} ({s.count})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const sbS = StyleSheet.create({
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: Spacing[3] },
  seg: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
});

// ─── Section card ─────────────────────────────────────────────────
function SectionCard({ label, children, colors }) {
  return (
    <View style={[secS.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      {label && <Text style={[secS.label, { color: colors.teal }]}>{label}</Text>}
      {children}
    </View>
  );
}

const secS = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3] },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function DoctorAnalyticsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [days, setDays] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-analytics', days],
    queryFn: () => fetchAnalytics(days),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [days]);

  const total       = data?.appointments_this_month ?? 0;
  const newPatients = data?.new_patients_this_month ?? 0;
  const totalPatients = data?.total_patients ?? 0;
  const returning   = Math.max(totalPatients - newPatients, 0);
  const completionRate = data?.consultation_completion_rate != null
    ? Math.round(data.consultation_completion_rate)
    : 0;

  const dailyAppointments = data?.daily_appointments ?? [];
  const periodTotal = dailyAppointments.reduce((sum, d) => sum + (d.total ?? 0), 0);
  const periodCompleted = dailyAppointments.reduce((sum, d) => sum + (d.completed ?? 0), 0);
  const periodCancelled = dailyAppointments.reduce((sum, d) => sum + (d.cancelled ?? 0), 0);
  const periodPending = dailyAppointments.reduce(
    (sum, d) => sum + Math.max((d.total ?? 0) - (d.completed ?? 0) - (d.cancelled ?? 0), 0),
    0
  );

  const chartData = dailyAppointments.map((d) => ({
    label: d.date ? new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }) : '',
    count: d.total ?? 0,
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>
        <RangePicker active={days} onChange={setDays} colors={colors} />
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.teal} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
        >
          {/* Summary cards */}
          <View style={styles.statsRow}>
            <StatCard value={total}          label="This Month"    icon="calendar-outline"   iconColor="#0D9B76" iconBg="#E6F7F2" colors={colors} />
            <StatCard value={newPatients}    label="New Patients"    icon="person-add-outline"  iconColor="#0BA5EC" iconBg="#E0F2FE" colors={colors} />
            <StatCard value={`${completionRate}%`} label="Completion" icon="checkmark-done-outline" iconColor="#12B76A" iconBg="#DCFCE7" colors={colors} />
          </View>

          {/* Bar chart */}
          <SectionCard label="APPOINTMENTS OVER TIME" colors={colors}>
            {chartData.length > 0 ? (
              <BarChart data={chartData} colors={colors} />
            ) : (
              <Text style={[{ fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, color: colors.textSecondary, paddingVertical: Spacing[4] }]}>
                No daily data available for this period.
              </Text>
            )}
          </SectionCard>

          {/* Status breakdown */}
          <SectionCard label="APPOINTMENT STATUSES" colors={colors}>
            <StatusBar2
              completed={periodCompleted}
              cancelled={periodCancelled}
              pending={periodPending}
              total={periodTotal || periodCompleted + periodCancelled + periodPending}
              colors={colors}
            />
          </SectionCard>

          {/* Patient breakdown */}
          <SectionCard label="PATIENT BREAKDOWN" colors={colors}>
            <View style={styles.patientRow}>
              <View style={[styles.patientBox, { backgroundColor: colors.tealLight }]}>
                <Text style={[styles.patientNum, { color: colors.teal }]}>{newPatients}</Text>
                <Text style={[styles.patientLabel, { color: colors.tealDark ?? colors.teal }]}>New</Text>
              </View>
              <View style={[styles.patientBox, { backgroundColor: colors.neutral100 ?? '#F1F3F5' }]}>
                <Text style={[styles.patientNum, { color: colors.textPrimary }]}>{returning}</Text>
                <Text style={[styles.patientLabel, { color: colors.textSecondary }]}>Returning</Text>
              </View>
            </View>
          </SectionCard>

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
    gap: Spacing[3],
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.nunitoBold, fontSize: 18, flex: 1 },
  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },
  statsRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3] },
  patientRow: { flexDirection: 'row', gap: Spacing[3] },
  patientBox: { flex: 1, borderRadius: Radius.md, padding: Spacing[4], alignItems: 'center' },
  patientNum: { fontFamily: FontFamily.dmMonoMedium, fontSize: 28, marginBottom: 4 },
  patientLabel: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },
  reasonRow: { paddingVertical: Spacing[3], borderBottomWidth: 1, gap: 6 },
  reasonText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
  reasonCount: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  reasonBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  reasonFill: { height: '100%', borderRadius: 2 },
});