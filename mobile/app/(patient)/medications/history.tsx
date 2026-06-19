import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getMedicationLogs } from '@/api/medications';
import { LoadingState } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { TabBar } from '@/components/lumina/MetricCard';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function MedicationHistoryScreen() {
  const { colors } = useLuminaTheme();
  const { activePatientId } = useActivePatient();
  const [range, setRange] = useState<'week' | 'month'>('week');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['medication-logs', activePatientId],
    queryFn: () => getMedicationLogs({ patient_id: activePatientId ?? undefined }),
  });

  const stats = useMemo(() => {
    if (!logs?.length) return { adherence: 0, missed: 0, taken: 0 };
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (range === 'week' ? 7 : 30));
    const filtered = logs.filter((l) => new Date(l.scheduled_for) >= cutoff);
    const taken = filtered.filter((l) => l.status === 'taken').length;
    const missed = filtered.filter((l) => l.status === 'missed').length;
    const total = taken + missed;
    return { adherence: total ? Math.round((taken / total) * 100) : 0, missed, taken };
  }, [logs, range]);

  const chartData = useMemo(() => {
    const days = range === 'week' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dayLogs = logs?.filter((l) => new Date(l.scheduled_for).toDateString() === d.toDateString()) ?? [];
      const taken = dayLogs.filter((l) => l.status === 'taken').length;
      return { label: d.toLocaleDateString('en-US', { weekday: range === 'week' ? 'short' : undefined, day: range === 'month' ? 'numeric' : undefined }), taken, total: dayLogs.length };
    });
  }, [logs, range]);

  const maxBar = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Medication History" />
      <TabBar tabs={[{ key: 'week', label: 'Weekly' }, { key: 'month', label: 'Monthly' }]} active={range} onChange={setRange} />
      {isLoading ? (
        <LoadingState />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.statRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Stat label="Adherence" value={`${stats.adherence}%`} colors={colors} />
            <Stat label="Taken" value={String(stats.taken)} colors={colors} />
            <Stat label="Missed" value={String(stats.missed)} colors={colors} />
          </View>
          <Text style={[styles.chartTitle, { color: colors.textMuted }]}>DAILY LOGS</Text>
          <View style={styles.chart}>
            {chartData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.barFill, { backgroundColor: colors.tabActive, height: `${(d.taken / maxBar) * 100}%` }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.textMuted }]} numberOfLines={1}>{d.label}</Text>
              </View>
            ))}
          </View>
          {logs?.slice(0, 20).map((log) => (
            <View key={log.id} style={[styles.logRow, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, flex: 1 }}>{log.medication_name}</Text>
              <Text style={{ color: log.status === 'taken' ? colors.accentMintText : colors.accentRedText, fontWeight: '600' }}>{log.status.toUpperCase()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40 },
  statRow: { flexDirection: 'row', borderRadius: LuminaRadius.lg, borderWidth: 1, padding: LuminaSpacing.lg, marginBottom: LuminaSpacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...LuminaTypography.h2 },
  statLabel: { fontSize: 11 },
  chartTitle: { ...LuminaTypography.caption, marginBottom: LuminaSpacing.md },
  chart: { flexDirection: 'row', height: 120, gap: 4, marginBottom: LuminaSpacing.xl },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: '80%', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 8, marginTop: 4 },
  logRow: { flexDirection: 'row', paddingVertical: LuminaSpacing.sm, borderBottomWidth: 1 },
});
