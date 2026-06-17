import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { getUpcomingAppointments, getCompletedAppointments, getCancelledAppointments, getWaitlist } from '@/api/appointments';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { StatusBadge } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { TabBar } from '@/components/lumina/MetricCard';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { formatDoctorName } from '@/api/types';

type Tab = 'upcoming' | 'completed' | 'cancelled' | 'waitlist';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const [tab, setTab] = useState<Tab>('upcoming');

  const upcoming = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: () => getUpcomingAppointments(), enabled: tab === 'upcoming' });
  const completed = useQuery({ queryKey: ['appointments', 'completed'], queryFn: () => getCompletedAppointments(), enabled: tab === 'completed' });
  const cancelled = useQuery({ queryKey: ['appointments', 'cancelled'], queryFn: () => getCancelledAppointments(), enabled: tab === 'cancelled' });
  const waitlist = useQuery({ queryKey: ['appointments', 'waitlist'], queryFn: getWaitlist, enabled: tab === 'waitlist' });

  const activeQuery = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : tab === 'cancelled' ? cancelled : waitlist;
  const isLoading = activeQuery.isLoading;

  const items: Appointment[] =
    tab === 'waitlist' ? [] : ((activeQuery.data as { items?: Appointment[] })?.items ?? []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Appointments" />
      <TabBar
        tabs={[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Done' },
          { key: 'cancelled', label: 'Cancelled' },
          { key: 'waitlist', label: 'Waitlist' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <LoadingState />
      ) : tab === 'waitlist' ? (
        (waitlist.data?.length ?? 0) === 0 ? (
          <EmptyState icon="time-outline" title="No waitlist entries" actionLabel="Find a Doctor" onAction={() => router.push('/(patient)/(tabs)/doctors')} />
        ) : (
          <FlatList
            data={waitlist.data}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.doctor, { color: colors.text }]}>{item.doctor_name ?? 'Doctor'}</Text>
                <StatusBadge status={item.status} />
                <Text style={{ color: colors.textMuted, marginTop: 4 }}>{item.desired_date ?? item.preferred_date ?? 'Any date'}</Text>
              </View>
            )}
          />
        )
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title={`No ${tab} appointments`} actionLabel="Book Appointment" onAction={() => router.push('/(patient)/(tabs)/doctors')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/(patient)/appointments/${item.id}`)}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.doctor, { color: colors.text }]}>{formatDoctorName(item.doctor?.full_name)}</Text>
                  <Text style={{ color: colors.textSecondary }}>{item.appointment_date} · {item.start_time?.slice(0, 5)}</Text>
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
  list: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.sm },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  doctor: { ...LuminaTypography.h3 },
});
