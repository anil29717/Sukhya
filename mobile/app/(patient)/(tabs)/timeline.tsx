import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHealthTimeline } from '@/api/timeline';
import { listVitals } from '@/api/medications';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { TimelineEvent } from '@/api/types';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  appointment: 'calendar',
  doctor_visit: 'medical',
  prescription: 'medkit',
  medical_record: 'document-text',
  vital: 'pulse',
};

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const { activePatientId } = useActivePatient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['timeline', activePatientId],
    queryFn: () => getHealthTimeline({ patient_id: activePatientId ?? undefined, page_size: 50 }),
  });

  const { data: vitals } = useQuery({
    queryKey: ['vitals-timeline', activePatientId],
    queryFn: () => listVitals({ patient_id: activePatientId ?? undefined }),
  });

  const timelineItems: TimelineEvent[] = [...(data?.items ?? [])];
  vitals?.slice(0, 5).forEach((v) => {
    timelineItems.push({
      event_type: 'vital',
      reference_id: v.id,
      title: `${v.vital_type.replace(/_/g, ' ')} logged`,
      summary: `${v.value}${v.unit ? ` ${v.unit}` : ''}`,
      event_at: v.recorded_at,
      patient_id: v.patient_id,
      extra: null,
    });
  });
  timelineItems.sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());

  const grouped = timelineItems.reduce<Record<string, TimelineEvent[]>>((acc, item) => {
    const year = new Date(item.event_at).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});

  const sections = Object.keys(grouped).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Health Timeline</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your complete health journey</Text>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : sections.length === 0 ? (
        <EmptyState icon="time-outline" title="No timeline events yet" message="Book appointments, upload records, or log vitals to build your timeline." actionLabel="Book Appointment" onAction={() => router.push('/(patient)/(tabs)/doctors')} />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(y) => y}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item: year }) => (
            <View>
              <Text style={[styles.yearLabel, { color: colors.textMuted }]}>{year}</Text>
              {grouped[year].map((ev) => (
                <View key={`${ev.event_type}-${ev.reference_id}`} style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.eventIcon, { backgroundColor: colors.accentTealLight }]}>
                    <Ionicons name={EVENT_ICONS[ev.event_type] ?? 'ellipse'} size={20} color={colors.accentTeal} />
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>{ev.title}</Text>
                    {ev.summary ? <Text style={[styles.eventSummary, { color: colors.textSecondary }]}>{ev.summary}</Text> : null}
                    <Text style={[styles.eventDate, { color: colors.textMuted }]}>{new Date(ev.event_at).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: LuminaSpacing.lg, paddingTop: LuminaSpacing.md, marginBottom: LuminaSpacing.md },
  title: { ...LuminaTypography.h1 },
  subtitle: { ...LuminaTypography.bodySmall, marginTop: 2 },
  list: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: 120 },
  yearLabel: { ...LuminaTypography.caption, marginVertical: LuminaSpacing.md },
  eventCard: { flexDirection: 'row', gap: LuminaSpacing.md, padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1, marginBottom: LuminaSpacing.sm },
  eventIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  eventBody: { flex: 1 },
  eventTitle: { ...LuminaTypography.h3 },
  eventSummary: { ...LuminaTypography.bodySmall, marginTop: 2 },
  eventDate: { fontSize: 11, marginTop: 4 },
});
