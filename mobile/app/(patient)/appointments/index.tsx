import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { getUpcomingAppointments, getCompletedAppointments, getCancelledAppointments, getWaitlist } from '@/api/appointments';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { StatusBadge } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SegmentedControl } from '@/components/lumina/SegmentedControl';
import { AppointmentCard } from '@/components/lumina/AppointmentCard';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { formatDoctorName } from '@/api/types';

type Tab = 'upcoming' | 'completed' | 'cancelled' | 'waitlist';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'patient' });
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
      <SegmentedControl
        segments={[
          { key: 'upcoming' as Tab, label: 'Upcoming' },
          { key: 'completed' as Tab, label: 'Done' },
          { key: 'cancelled' as Tab, label: 'Cancelled' },
          { key: 'waitlist' as Tab, label: 'Waitlist' },
        ]}
        active={tab}
        onChange={setTab}
        role="patient"
      />

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : tab === 'waitlist' ? (
        (waitlist.data?.length ?? 0) === 0 ? (
          <EmptyState icon="time-outline" title="No waitlist entries" actionLabel="Find a Doctor" onAction={() => router.push('/(patient)/(tabs)/doctors')} />
        ) : (
          <FlatList
            data={waitlist.data}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.waitlistCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
                <Text style={[styles.doctor, { color: colors.text }]}>{item.doctor_name ?? 'Doctor'}</Text>
                <StatusBadge status={item.status} />
                <Text style={[styles.meta, { color: colors.textMuted }]}>{item.desired_date ?? item.preferred_date ?? 'Any date'}</Text>
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
            <AppointmentCard
              appointment={{
                id: item.id,
                doctorName: formatDoctorName(item.doctor?.full_name),
                time: item.start_time?.slice(0, 5),
                date: item.appointment_date,
                status: item.status,
                reason: item.reason,
              }}
              onPress={() => router.push(`/(patient)/appointments/${item.id}`)}
              role="patient"
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.md, paddingBottom: 40 },
  waitlistCard: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, marginBottom: LuminaSpacing.md, gap: LuminaSpacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  doctor: { ...LuminaTypography.h3 },
  meta: { fontSize: 12, fontFamily: LuminaFontFamily.dmSansRegular },
});
