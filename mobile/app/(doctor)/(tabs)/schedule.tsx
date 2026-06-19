import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getTodayAppointments, getUpcomingAppointments } from '@/api/appointments';
import { createLeave, deleteLeave, getAvailability, getLeaves } from '@/api/doctor';
import { DAY_NAMES, formatTime12 } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { TabBar } from '@/components/lumina/MetricCard';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

type Tab = 'availability' | 'leave' | 'calendar';

export default function DoctorScheduleTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('availability');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const availability = useQuery({ queryKey: ['availability'], queryFn: getAvailability });
  const leaves = useQuery({ queryKey: ['leaves'], queryFn: getLeaves });
  const todayAppts = useQuery({ queryKey: ['appointments', 'today'], queryFn: getTodayAppointments });
  const upcomingAppts = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: () => getUpcomingAppointments() });

  const addLeaveMutation = useMutation({
    mutationFn: () => createLeave({ start_date: leaveStart, end_date: leaveEnd, reason: leaveReason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      Alert.alert('Leave added', 'Your leave has been recorded.');
    },
    onError: () => Alert.alert('Error', 'Could not add leave. Check date format (YYYY-MM-DD).'),
  });

  const removeLeaveMutation = useMutation({
    mutationFn: deleteLeave,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });

  const slots = availability.data ?? [];
  const activeSlots = slots.filter((s) => s.is_active);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Schedule</Text>
      </View>
      <TabBar
        tabs={[
          { key: 'availability', label: 'Hours' },
          { key: 'leave', label: 'Leave' },
          { key: 'calendar', label: 'Calendar' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'availability' && (
          availability.isLoading ? <LoadingState /> : (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Weekly working hours</Text>
              {DAY_NAMES.map((day, idx) => {
                const daySlots = activeSlots.filter((s) => s.day_of_week === idx);
                return (
                  <LuminaCard key={day} style={styles.dayCard}>
                    <Text style={[styles.dayName, { color: colors.text }]}>{day}</Text>
                    {daySlots.length === 0 ? (
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>Not available</Text>
                    ) : (
                      daySlots.map((slot) => (
                        <Text key={slot.id} style={{ color: colors.textSecondary, fontSize: 13 }}>
                          {formatTime12(slot.start_time)} – {formatTime12(slot.end_time)}
                        </Text>
                      ))
                    )}
                  </LuminaCard>
                );
              })}
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Contact admin or use the web portal to bulk-edit availability via PUT /doctors/me/availability.
              </Text>
            </>
          )
        )}

        {tab === 'leave' && (
          leaves.isLoading ? <LoadingState /> : (
            <>
              <LuminaCard>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Add leave</Text>
                <LuminaInput label="Start date (YYYY-MM-DD)" value={leaveStart} onChangeText={setLeaveStart} />
                <LuminaInput label="End date (YYYY-MM-DD)" value={leaveEnd} onChangeText={setLeaveEnd} />
                <LuminaInput label="Reason (optional)" value={leaveReason} onChangeText={setLeaveReason} />
                <LuminaButton label="Add Leave" onPress={() => addLeaveMutation.mutate()} loading={addLeaveMutation.isPending} />
              </LuminaCard>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: LuminaSpacing.lg }]}>Planned leave</Text>
              {(leaves.data ?? []).length === 0 ? (
                <EmptyState icon="airplane-outline" title="No leave scheduled" />
              ) : (
                (leaves.data ?? []).map((leave) => (
                  <LuminaCard key={leave.id} style={styles.leaveCard}>
                    <View style={styles.leaveRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '600' }}>{leave.start_date} → {leave.end_date}</Text>
                        {leave.reason ? <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{leave.reason}</Text> : null}
                      </View>
                      <Pressable onPress={() => removeLeaveMutation.mutate(leave.id)}>
                        <Ionicons name="trash-outline" size={20} color={colors.accentRed} />
                      </Pressable>
                    </View>
                  </LuminaCard>
                ))
              )}
            </>
          )
        )}

        {tab === 'calendar' && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Upcoming appointments</Text>
            {((upcomingAppts.data?.items ?? []).length === 0 && (todayAppts.data?.items ?? []).length === 0) ? (
              <EmptyState icon="calendar-outline" title="No appointments on calendar" />
            ) : (
              [...(todayAppts.data?.items ?? []), ...(upcomingAppts.data?.items ?? [])].slice(0, 20).map((appt) => (
                <Pressable key={appt.id} onPress={() => router.push(`/(doctor)/appointments/${appt.id}` as never)}>
                  <LuminaCard style={styles.calCard}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{appt.patient?.full_name ?? 'Patient'}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{appt.appointment_date} · {formatTime12(appt.start_time)}</Text>
                  </LuminaCard>
                </Pressable>
              ))
            )}
            {(leaves.data ?? []).length > 0 ? (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: LuminaSpacing.lg }]}>Leave blocks</Text>
                {(leaves.data ?? []).map((leave) => (
                  <LuminaCard key={leave.id}>
                    <Text style={{ color: colors.accentRed, fontWeight: '600' }}>Leave: {leave.start_date} – {leave.end_date}</Text>
                  </LuminaCard>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: LuminaSpacing.sm },
  title: { ...LuminaTypography.h1, fontSize: 28 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 100, gap: LuminaSpacing.sm },
  sectionLabel: { ...LuminaTypography.label, marginBottom: LuminaSpacing.sm },
  dayCard: { marginBottom: LuminaSpacing.sm },
  dayName: { fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 12, marginTop: LuminaSpacing.md, lineHeight: 18 },
  leaveCard: { marginBottom: LuminaSpacing.sm },
  leaveRow: { flexDirection: 'row', alignItems: 'center' },
  calCard: { marginBottom: LuminaSpacing.sm },
});
