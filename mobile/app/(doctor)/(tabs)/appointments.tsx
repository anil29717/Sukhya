import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getTodayAppointments,
  getUpcomingAppointments,
  getCompletedAppointments,
  getCancelledAppointments,
} from '@/api/appointments';
import { Appointment, formatTime12 } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { StatusBadge } from '@/components/lumina/LuminaButton';
import { TabBar } from '@/components/lumina/MetricCard';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

type Tab = 'today' | 'upcoming' | 'completed' | 'cancelled';

export default function DoctorAppointmentsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();
  const [tab, setTab] = useState<Tab>('today');

  const today = useQuery({ queryKey: ['appointments', 'today'], queryFn: getTodayAppointments, enabled: tab === 'today' });
  const upcoming = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: () => getUpcomingAppointments(), enabled: tab === 'upcoming' });
  const completed = useQuery({ queryKey: ['appointments', 'completed'], queryFn: () => getCompletedAppointments(), enabled: tab === 'completed' });
  const cancelled = useQuery({ queryKey: ['appointments', 'cancelled'], queryFn: () => getCancelledAppointments(), enabled: tab === 'cancelled' });

  const activeQuery = tab === 'today' ? today : tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : cancelled;
  const items: Appointment[] = activeQuery.data?.items ?? [];

  const emptyMessages = useMemo(
    () => ({
      today: 'No appointments today',
      upcoming: 'No upcoming appointments',
      completed: 'No completed appointments',
      cancelled: 'No cancelled appointments',
    }),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Appointments</Text>
      </View>
      <TabBar
        tabs={[
          { key: 'today', label: 'Today' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Done' },
          { key: 'cancelled', label: 'Cancelled' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {activeQuery.isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title={emptyMessages[tab]} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/(doctor)/appointments/${item.id}` as never)}
            >
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.patient, { color: colors.text }]}>{item.patient?.full_name ?? 'Patient'}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {item.appointment_date} · {formatTime12(item.start_time)}
                  </Text>
                  {item.reason ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>{item.reason}</Text> : null}
                </View>
                <StatusBadge status={item.status} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: LuminaSpacing.sm },
  title: { ...LuminaTypography.h1, fontSize: 28 },
  list: { padding: LuminaSpacing.lg, paddingBottom: 100, gap: LuminaSpacing.sm },
  card: { borderRadius: LuminaRadius.lg, borderWidth: 1, padding: LuminaSpacing.lg, marginBottom: LuminaSpacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  patient: { ...LuminaTypography.label, fontSize: 16 },
});
