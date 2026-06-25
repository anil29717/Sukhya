import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMedicationLogs } from '@/api/medications';
import { MedicationLog } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SegmentedControl } from '@/components/lumina/SegmentedControl';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const CHART_HEIGHT = 132;
const BAR_MAX = 72;

type DayBucket = {
  key: string;
  label: string;
  sublabel?: string;
  taken: number;
  missed: number;
  total: number;
};

function formatLogDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function buildChartBuckets(logs: MedicationLog[], range: 'week' | 'month'): DayBucket[] {
  if (range === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const dayLogs = logs.filter((l) => {
        const ld = new Date(l.scheduled_for);
        ld.setHours(0, 0, 0, 0);
        return ld.getTime() === d.getTime();
      });
      const taken = dayLogs.filter((l) => l.status === 'taken').length;
      const missed = dayLogs.filter((l) => l.status === 'missed').length;
      const isToday = i === 6;
      return {
        key: d.toISOString(),
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        sublabel: isToday ? 'Today' : d.getDate().toString(),
        taken,
        missed,
        total: dayLogs.length,
      };
    });
  }

  // Monthly: 4 weekly buckets for readability
  return Array.from({ length: 4 }, (_, i) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const weekLogs = logs.filter((l) => {
      const t = new Date(l.scheduled_for).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const taken = weekLogs.filter((l) => l.status === 'taken').length;
    const missed = weekLogs.filter((l) => l.status === 'missed').length;

    return {
      key: `week-${i}`,
      label: `W${4 - i}`,
      sublabel: `${start.getDate()}–${end.getDate()}`,
      taken,
      missed,
      total: weekLogs.length,
    };
  }).reverse();
}

function AdherenceRing({
  percent,
  colors,
}: {
  percent: number;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={[ringStyles.wrap, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}>
      <View style={[ringStyles.inner, { backgroundColor: colors.surface }]}>
        <Text style={[ringStyles.value, { color: colors.coral }]}>{clamped}%</Text>
        <Text style={[ringStyles.label, { color: colors.textMuted }]}>Adherence</Text>
      </View>
      <View
        style={[
          ringStyles.arc,
          {
            borderColor: colors.coral,
            borderTopColor: clamped >= 25 ? colors.coral : 'transparent',
            borderRightColor: clamped >= 50 ? colors.coral : 'transparent',
            borderBottomColor: clamped >= 75 ? colors.coral : 'transparent',
            borderLeftColor: clamped >= 100 ? colors.coral : 'transparent',
          },
        ]}
      />
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  arc: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    borderWidth: 4,
  },
  inner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 22, letterSpacing: -0.5 },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 10, marginTop: 1 },
});

function StatTile({
  icon,
  label,
  value,
  color,
  bg,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  bg: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  return (
    <View style={[tileStyles.wrap, LuminaShadow.sm, { backgroundColor: colors.surface, borderColor: 'rgba(255,255,255,0.65)' }]}>
      <View style={[tileStyles.icon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[tileStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[tileStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    gap: 4,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 20, letterSpacing: -0.3 },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11 },
});

function AdherenceChart({
  buckets,
  range,
  colors,
}: {
  buckets: DayBucket[];
  range: 'week' | 'month';
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const maxTotal = Math.max(...buckets.map((b) => b.total), 1);

  return (
    <View style={[chartStyles.card, LuminaShadow.sm, { backgroundColor: colors.surface, borderColor: 'rgba(255,255,255,0.65)' }]}>
      <View style={chartStyles.header}>
        <Text style={[chartStyles.title, { color: colors.text }]}>
          {range === 'week' ? 'Daily adherence' : 'Weekly breakdown'}
        </Text>
        <View style={chartStyles.legend}>
          <View style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: colors.teal }]} />
            <Text style={[chartStyles.legendText, { color: colors.textMuted }]}>Taken</Text>
          </View>
          <View style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: colors.errorText }]} />
            <Text style={[chartStyles.legendText, { color: colors.textMuted }]}>Missed</Text>
          </View>
        </View>
      </View>

      <View style={[chartStyles.plot, { height: CHART_HEIGHT }]}>
        {buckets.map((bucket) => {
          const takenH = bucket.total ? (bucket.taken / maxTotal) * BAR_MAX : 0;
          const missedH = bucket.total ? (bucket.missed / maxTotal) * BAR_MAX : 0;
          const hasData = bucket.total > 0;

          return (
            <View key={bucket.key} style={chartStyles.col}>
              <View style={chartStyles.barArea}>
                <View style={[chartStyles.barTrack, { backgroundColor: colors.neutral100, height: BAR_MAX }]}>
                  {hasData ? (
                    <>
                      {missedH > 0 ? (
                        <View
                          style={[
                            chartStyles.barMissed,
                            { height: missedH, backgroundColor: colors.errorSoft, borderColor: colors.errorText + '44' },
                          ]}
                        />
                      ) : null}
                      {takenH > 0 ? (
                        <View
                          style={[
                            chartStyles.barTaken,
                            { height: takenH, backgroundColor: colors.teal },
                          ]}
                        />
                      ) : null}
                    </>
                  ) : (
                    <View style={[chartStyles.barEmpty, { backgroundColor: colors.border }]} />
                  )}
                </View>
                {hasData ? (
                  <Text style={[chartStyles.barCount, { color: colors.textSecondary }]}>
                    {bucket.taken}/{bucket.total}
                  </Text>
                ) : null}
              </View>
              <Text style={[chartStyles.barLabel, { color: colors.text }]} numberOfLines={1}>
                {bucket.label}
              </Text>
              {bucket.sublabel ? (
                <Text style={[chartStyles.barSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {bucket.sublabel}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
    borderWidth: 1,
    marginBottom: LuminaSpacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: LuminaSpacing.lg,
    gap: 8,
  },
  title: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15, flex: 1 },
  legend: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 10 },
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barArea: { alignItems: 'center', justifyContent: 'flex-end', height: BAR_MAX + 18 },
  barTrack: {
    width: '78%',
    borderRadius: LuminaRadius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  barTaken: {
    width: '100%',
    borderTopLeftRadius: LuminaRadius.sm,
    borderTopRightRadius: LuminaRadius.sm,
  },
  barMissed: {
    width: '100%',
    borderTopWidth: 1,
  },
  barEmpty: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  barCount: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 9, marginTop: 4 },
  barLabel: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
  barSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 9 },
});

function LogRow({
  log,
  colors,
  isLast,
}: {
  log: MedicationLog;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  isLast?: boolean;
}) {
  const isTaken = log.status === 'taken';
  const accent = isTaken ? colors.teal : colors.errorText;
  const accentBg = isTaken ? colors.tealSoft : colors.errorSoft;

  return (
    <View
      style={[
        logStyles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[logStyles.accent, { backgroundColor: accent }]} />
      <View style={[logStyles.icon, { backgroundColor: accentBg }]}>
        <Ionicons name="medical-outline" size={16} color={accent} />
      </View>
      <View style={logStyles.body}>
        <Text style={[logStyles.name, { color: colors.text }]} numberOfLines={1}>
          {log.medication_name}
        </Text>
        <Text style={[logStyles.time, { color: colors.textMuted }]}>
          {formatLogDate(log.scheduled_for)} · {formatLogTime(log.scheduled_for)}
        </Text>
      </View>
      <View style={[logStyles.badge, { backgroundColor: accentBg }]}>
        <Ionicons name={isTaken ? 'checkmark-circle' : 'close-circle'} size={12} color={accent} />
        <Text style={[logStyles.badgeText, { color: accent }]}>
          {isTaken ? 'Taken' : 'Missed'}
        </Text>
      </View>
    </View>
  );
}

const logStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingRight: 12,
    overflow: 'hidden',
  },
  accent: { width: 3, alignSelf: 'stretch' },
  icon: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  body: { flex: 1, gap: 2 },
  name: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  time: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 11 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
  },
  badgeText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 10 },
});

export default function MedicationHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { activePatientId } = useActivePatient();
  const [range, setRange] = useState<'week' | 'month'>('week');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['medication-logs', activePatientId],
    queryFn: () => getMedicationLogs({ patient_id: activePatientId ?? undefined }),
  });

  const cutoffDays = range === 'week' ? 7 : 28;

  const filteredLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - cutoffDays + 1);
    return (logs ?? [])
      .filter((l) => new Date(l.scheduled_for) >= cutoff)
      .sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime());
  }, [logs, cutoffDays]);

  const stats = useMemo(() => {
    const taken = filteredLogs.filter((l) => l.status === 'taken').length;
    const missed = filteredLogs.filter((l) => l.status === 'missed').length;
    const total = taken + missed;
    return {
      adherence: total ? Math.round((taken / total) * 100) : 0,
      missed,
      taken,
      total,
    };
  }, [filteredLogs]);

  const chartBuckets = useMemo(
    () => buildChartBuckets(filteredLogs, range),
    [filteredLogs, range],
  );

  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: MedicationLog[] }[] = [];
    for (const log of filteredLogs) {
      const dateKey = new Date(log.scheduled_for).toDateString();
      const existing = groups.find((g) => g.date === dateKey);
      if (existing) existing.items.push(log);
      else groups.push({ date: dateKey, items: [log] });
    }
    return groups;
  }, [filteredLogs]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Medication History"
        subtitle={range === 'week' ? 'Last 7 days' : 'Last 4 weeks'}
        role="patient"
      />

      <SegmentedControl
        role="patient"
        segments={[
          { key: 'week', label: 'Weekly' },
          { key: 'month', label: 'Monthly' },
        ]}
        active={range}
        onChange={setRange}
      />

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : !logs?.length ? (
        <EmptyState
          role="patient"
          icon="stats-chart-outline"
          title="No medication logs yet"
          message="Log doses from the Medications screen to track your adherence here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary hero */}
          <View style={[styles.summaryCard, LuminaShadow.md, { backgroundColor: colors.surface, borderColor: 'rgba(255,255,255,0.65)' }]}>
            <AdherenceRing percent={stats.adherence} colors={colors} />
            <View style={styles.summaryBody}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {stats.adherence >= 80 ? 'Great consistency' : stats.adherence >= 50 ? 'Keep it up' : 'Room to improve'}
              </Text>
              <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
                {stats.taken} of {stats.total} doses taken in this period
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <StatTile
              icon="checkmark-circle-outline"
              label="Taken"
              value={String(stats.taken)}
              color={colors.teal}
              bg={colors.tealSoft}
              colors={colors}
            />
            <StatTile
              icon="close-circle-outline"
              label="Missed"
              value={String(stats.missed)}
              color={colors.errorText}
              bg={colors.errorSoft}
              colors={colors}
            />
            <StatTile
              icon="layers-outline"
              label="Total"
              value={String(stats.total)}
              color={colors.coral}
              bg={colors.coralSoft}
              colors={colors}
            />
          </View>

          <AdherenceChart buckets={chartBuckets} range={range} colors={colors} />

          <Text style={[styles.sectionLabel, { color: colors.coral }]}>DOSE LOG</Text>
          <View style={[styles.logCard, LuminaShadow.sm, { backgroundColor: colors.surface, borderColor: 'rgba(255,255,255,0.65)' }]}>
            {groupedLogs.length === 0 ? (
              <View style={styles.emptyLogs}>
                <Text style={[styles.emptyLogsText, { color: colors.textMuted }]}>
                  No logs in this period
                </Text>
              </View>
            ) : (
              groupedLogs.map((group, gi) => (
                <View key={group.date}>
                  <Text style={[styles.dateHeader, { color: colors.textSecondary }]}>
                    {formatLogDate(group.items[0].scheduled_for)}
                  </Text>
                  {group.items.map((log, li) => (
                    <LogRow
                      key={log.id}
                      log={log}
                      colors={colors}
                      isLast={gi === groupedLogs.length - 1 && li === group.items.length - 1}
                    />
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.sm,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.lg,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    marginBottom: LuminaSpacing.md,
  },
  summaryBody: { flex: 1, gap: 4 },
  summaryTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 18, letterSpacing: -0.2 },
  summarySub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, lineHeight: 18 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: LuminaSpacing.lg },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  logCard: {
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    paddingBottom: 4,
  },
  dateHeader: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: LuminaSpacing.lg,
    paddingTop: 12,
    paddingBottom: 4,
  },
  emptyLogs: { padding: LuminaSpacing.xxl, alignItems: 'center' },
  emptyLogsText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },
});
