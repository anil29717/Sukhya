import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getTodayAppointments, getUpcomingAppointments } from '@/api/appointments';
import { createLeave, deleteLeave, getAvailability, getLeaves } from '@/api/doctor';
import { formatTime12 } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { SegmentedControl } from '@/components/lumina/SegmentedControl';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { getStatusStyle } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

type Tab = 'availability' | 'leave' | 'calendar';

const DAYS = [
  { value: 0, label: 'Monday', short: 'Mon' },
  { value: 1, label: 'Tuesday', short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday', short: 'Thu' },
  { value: 4, label: 'Friday', short: 'Fri' },
  { value: 5, label: 'Saturday', short: 'Sat' },
  { value: 6, label: 'Sunday', short: 'Sun' },
];

function InfoBanner({ icon, title, body, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  return (
    <View style={[bannerS.wrap, { backgroundColor: colors.tealSoft }]}>
      <View style={[bannerS.icon, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={20} color={colors.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[bannerS.title, { color: colors.text }]}>{title}</Text>
        <Text style={[bannerS.body, { color: colors.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

const bannerS = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LuminaSpacing.md,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.lg,
    marginBottom: LuminaSpacing.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, marginBottom: 2 },
  body: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, lineHeight: 17 },
});

function SectionCard({
  label,
  children,
  surfaceColor,
}: {
  label?: string;
  children: React.ReactNode;
  surfaceColor: string;
}) {
  return (
    <View style={[secS.card, LuminaShadow.sm, { backgroundColor: surfaceColor }]}>
      {label ? <Text style={secS.label}>{label}</Text> : null}
      {children}
    </View>
  );
}

const secS = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.lg,
    padding: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#0D9B76',
    marginBottom: LuminaSpacing.md,
  },
});

export default function DoctorScheduleTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'doctor' });
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
      Alert.alert('Leave added', 'Patients will not be able to book during this period.');
    },
    onError: () => Alert.alert('Error', 'Could not add leave. Use date format YYYY-MM-DD.'),
  });

  const removeLeaveMutation = useMutation({
    mutationFn: deleteLeave,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });

  const slots = availability.data ?? [];
  const activeSlots = slots.filter((s) => s.is_active);
  const activeDays = DAYS.filter((d) => activeSlots.some((s) => s.day_of_week === d.value));
  const allAppts = [...(todayAppts.data?.items ?? []), ...(upcomingAppts.data?.items ?? [])];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Schedule</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your hours, leave, and upcoming visits
        </Text>
      </View>

      <SegmentedControl
        segments={[
          { key: 'availability' as Tab, label: 'Hours' },
          { key: 'leave' as Tab, label: 'Leave' },
          { key: 'calendar' as Tab, label: 'Calendar' },
        ]}
        active={tab}
        onChange={setTab}
        role="doctor"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'availability' && (
          availability.isLoading ? <LoadingSkeleton count={4} /> : (
            <>
              <InfoBanner
                icon="time-outline"
                title="Your working hours"
                body="These are the days and times patients can book appointments with you. Contact your clinic admin to change your schedule."
                colors={colors}
              />

              {activeDays.length > 0 ? (
                <View style={[styles.summaryStrip, { backgroundColor: colors.surface }, LuminaShadow.sm]}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    Available {activeDays.length} day{activeDays.length !== 1 ? 's' : ''} per week
                  </Text>
                </View>
              ) : null}

              <SectionCard label="WEEKLY HOURS" surfaceColor={colors.surface}>
                {DAYS.map((day, idx) => {
                  const daySlots = activeSlots.filter((s) => s.day_of_week === day.value);
                  const isActive = daySlots.length > 0;
                  return (
                    <View
                      key={day.value}
                      style={[
                        styles.dayRow,
                        idx < DAYS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={[styles.dayBadge, { backgroundColor: isActive ? colors.tealSoft : colors.neutral100 }]}>
                        <Text style={[styles.dayShort, { color: isActive ? colors.teal : colors.textMuted }]}>
                          {day.short}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dayLabel, { color: isActive ? colors.text : colors.textMuted }]}>
                          {day.label}
                        </Text>
                        {isActive ? (
                          daySlots.map((slot) => (
                            <Text key={slot.id} style={[styles.dayHours, { color: colors.textSecondary }]}>
                              {formatTime12(slot.start_time)} – {formatTime12(slot.end_time)}
                            </Text>
                          ))
                        ) : (
                          <Text style={[styles.dayOff, { color: colors.textMuted }]}>Day off</Text>
                        )}
                      </View>
                      <Ionicons
                        name={isActive ? 'checkmark-circle' : 'close-circle-outline'}
                        size={18}
                        color={isActive ? colors.teal : colors.textMuted}
                      />
                    </View>
                  );
                })}
              </SectionCard>
            </>
          )
        )}

        {tab === 'leave' && (
          leaves.isLoading ? <LoadingSkeleton count={3} /> : (
            <>
              <InfoBanner
                icon="airplane-outline"
                title="Mark time off"
                body="Block dates when you're unavailable. Existing appointments won't be auto-cancelled — review them in your calendar."
                colors={colors}
              />

              <SectionCard label="ADD LEAVE" surfaceColor={colors.surface}>
                <LuminaInput
                  label="Start date"
                  value={leaveStart}
                  onChangeText={setLeaveStart}
                  placeholder="YYYY-MM-DD"
                />
                <LuminaInput
                  label="End date"
                  value={leaveEnd}
                  onChangeText={setLeaveEnd}
                  placeholder="YYYY-MM-DD"
                />
                <LuminaInput
                  label="Reason (optional)"
                  value={leaveReason}
                  onChangeText={setLeaveReason}
                  placeholder="e.g. Conference, personal leave"
                />
                <LuminaButton
                  label="Add Leave"
                  role="doctor"
                  onPress={() => addLeaveMutation.mutate()}
                  loading={addLeaveMutation.isPending}
                />
              </SectionCard>

              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PLANNED LEAVE</Text>
              {(leaves.data ?? []).length === 0 ? (
                <EmptyState
                  icon="airplane-outline"
                  title="No leave scheduled"
                  message="You're fully available. Add leave dates above when you need time off."
                  role="doctor"
                />
              ) : (
                (leaves.data ?? []).map((leave) => (
                  <View
                    key={leave.id}
                    style={[styles.leaveCard, { backgroundColor: colors.surface }, LuminaShadow.sm]}
                  >
                    <View style={[styles.leaveIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="airplane" size={18} color="#B45309" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.leaveDates, { color: colors.text }]}>
                        {leave.start_date} → {leave.end_date}
                      </Text>
                      {leave.reason ? (
                        <Text style={[styles.leaveReason, { color: colors.textSecondary }]}>{leave.reason}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => Alert.alert('Remove leave?', '', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeLeaveMutation.mutate(leave.id) },
                      ])}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                ))
              )}
            </>
          )
        )}

        {tab === 'calendar' && (
          <>
            <InfoBanner
              icon="calendar-outline"
              title="Your calendar"
              body="Upcoming patient visits and leave blocks at a glance. Tap an appointment to view details."
              colors={colors}
            />

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>UPCOMING APPOINTMENTS</Text>
            {allAppts.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No upcoming visits"
                message="Your calendar is clear. New bookings will appear here."
                role="doctor"
              />
            ) : (
              allAppts.slice(0, 20).map((appt) => {
                const st = getStatusStyle(appt.status, colors);
                return (
                  <Pressable
                    key={appt.id}
                    onPress={() => router.push(`/(doctor)/appointments/${appt.id}` as never)}
                    style={[styles.calCard, { backgroundColor: colors.surface }, LuminaShadow.sm]}
                  >
                    <View style={[styles.calStatusBar, { backgroundColor: st.color }]} />
                    <View style={styles.calInner}>
                      <View style={styles.calTop}>
                        <Text style={[styles.calName, { color: colors.text }]} numberOfLines={1}>
                          {appt.patient?.full_name ?? 'Patient'}
                        </Text>
                        <View style={[styles.calBadge, { backgroundColor: st.bg }]}>
                          <Text style={[styles.calBadgeText, { color: st.color }]}>
                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.calMeta, { color: colors.textSecondary }]}>
                        {appt.appointment_date} · {formatTime12(appt.start_time)}
                      </Text>
                      {appt.reason ? (
                        <Text style={[styles.calReason, { color: colors.textMuted }]} numberOfLines={1}>
                          {appt.reason}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                );
              })
            )}

            {(leaves.data ?? []).length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: LuminaSpacing.lg }]}>
                  LEAVE BLOCKS
                </Text>
                {(leaves.data ?? []).map((leave) => (
                  <View
                    key={leave.id}
                    style={[styles.leaveBlock, { backgroundColor: '#FEE2E2' }]}
                  >
                    <Ionicons name="airplane-outline" size={16} color="#B91C1C" />
                    <Text style={styles.leaveBlockText}>
                      Leave: {leave.start_date} – {leave.end_date}
                    </Text>
                  </View>
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
  header: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: LuminaSpacing.sm },
  title: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 22 },
  subtitle: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, marginTop: 2 },
  scroll: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: 120, paddingTop: LuminaSpacing.sm },
  sectionTitle: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: LuminaSpacing.md,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.sm,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.lg,
    marginBottom: LuminaSpacing.md,
  },
  summaryText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    paddingVertical: LuminaSpacing.md,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayShort: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 12 },
  dayLabel: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  dayHours: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  dayOff: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  leaveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.lg,
    marginBottom: LuminaSpacing.sm,
  },
  leaveIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveDates: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  leaveReason: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  calCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LuminaRadius.lg,
    overflow: 'hidden',
    marginBottom: LuminaSpacing.sm,
  },
  calStatusBar: { width: 4, alignSelf: 'stretch' },
  calInner: { flex: 1, padding: LuminaSpacing.md, minWidth: 0 },
  calTop: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.sm, marginBottom: 2 },
  calName: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, flex: 1, flexShrink: 1 },
  calBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, flexShrink: 0 },
  calBadgeText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 10 },
  calMeta: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
  calReason: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11, marginTop: 2 },
  leaveBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.sm,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.md,
    marginBottom: LuminaSpacing.sm,
  },
  leaveBlockText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13, color: '#B91C1C' },
});
