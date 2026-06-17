import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getDoctorAnalytics } from '@/api/doctor';
import { LoadingState } from '@/components/lumina/ErrorState';
import { MetricCard } from '@/components/lumina/MetricCard';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorAnalyticsScreen() {
  const { colors } = useLuminaTheme();
  const { data, isLoading } = useQuery({ queryKey: ['doctor-analytics', 30], queryFn: () => getDoctorAnalytics(30) });

  if (isLoading) return <><ScreenHeader title="Performance" /><LoadingState /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Performance Dashboard" subtitle="Last 30 days" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.metricsRow}>
          <MetricCard icon="people-outline" label="Total Patients" value={data?.total_patients ?? 0} />
          <MetricCard icon="calendar-outline" label="This Month" value={data?.appointments_this_month ?? 0} />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard icon="checkmark-circle-outline" label="Completed" value={data?.completed_consultations ?? 0} />
          <MetricCard icon="arrow-redo-outline" label="Follow-Ups" value={data?.pending_follow_ups ?? 0} />
        </View>

        <LuminaCard>
          <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Consultation completion rate</Text>
          <Text style={[styles.rateValue, { color: colors.accentTeal }]}>
            {((data?.consultation_completion_rate ?? 0) * 100).toFixed(0)}%
          </Text>
        </LuminaCard>

        <Text style={[styles.section, { color: colors.text }]}>Weekly Activity</Text>
        {(data?.daily_appointments ?? []).slice(-7).map((day) => (
          <LuminaCard key={day.date} style={styles.dayRow}>
            <Text style={{ color: colors.text, fontWeight: '600', width: 100 }}>{day.date}</Text>
            <Text style={{ color: colors.textSecondary, flex: 1 }}>{day.total} appts · {day.completed} done · {day.cancelled} cancelled</Text>
          </LuminaCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.md },
  metricsRow: { flexDirection: 'row', gap: LuminaSpacing.md },
  rateLabel: { ...LuminaTypography.caption },
  rateValue: { ...LuminaTypography.h1, marginTop: 4 },
  section: { ...LuminaTypography.h3, marginTop: LuminaSpacing.sm },
  dayRow: { marginBottom: LuminaSpacing.sm },
});
