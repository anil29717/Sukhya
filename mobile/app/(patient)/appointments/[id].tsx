import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { formatDoctorName } from '@/api/types';
import {
  cancelAppointment,
  getAppointment,
  getDoctorSlots,
  quickRebook,
  QuickRebookResponse,
  rescheduleAppointment,
} from '@/api/appointments';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { buildDateItems, DateStrip } from '@/components/lumina/DateStrip';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SlotGrid } from '@/components/lumina/SlotGrid';
import {
  LuminaFontFamily,
  LuminaRadius,
  LuminaShadow,
  LuminaSpacing,
  getStatusStyle,
} from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const DATES = buildDateItems(14);

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pending: 'time-outline',
  confirmed: 'checkmark-circle-outline',
  scheduled: 'calendar-outline',
  completed: 'checkmark-done-circle-outline',
  cancelled: 'close-circle-outline',
};

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDisplayTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function InfoRow({
  icon,
  label,
  value,
  colors,
  isLast,
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  isLast?: boolean;
  mono?: boolean;
}) {
  return (
    <View
      style={[
        infoStyles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[infoStyles.iconWrap, { backgroundColor: colors.neutral100 }]}>
        <Ionicons name={icon} size={15} color={colors.coral} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}</Text>
        <Text
          style={[
            infoStyles.value,
            { color: colors.text },
            mono && { fontFamily: LuminaFontFamily.dmMonoMedium },
          ]}
          numberOfLines={3}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: LuminaRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, lineHeight: 20 },
});

function ActionTile({
  icon,
  label,
  sublabel,
  iconBg,
  iconColor,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={({ pressed }) => [
        actionStyles.tile,
        LuminaShadow.sm,
        {
          backgroundColor: colors.surface,
          borderColor: 'rgba(255,255,255,0.65)',
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[actionStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[actionStyles.label, { color: colors.text }]}>{label}</Text>
      <Text style={[actionStyles.sublabel, { color: colors.textMuted }]} numberOfLines={2}>
        {sublabel}
      </Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: LuminaSpacing.lg,
    paddingHorizontal: LuminaSpacing.sm,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    gap: 6,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 14, textAlign: 'center' },
  sublabel: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });

  const apptId = parseInt(id!, 10);

  const [showRescheduleSheet, setShowRescheduleSheet] = useState(false);
  const [showRebookConfirm, setShowRebookConfirm] = useState(false);
  const [rebookResult, setRebookResult] = useState<QuickRebookResponse | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(DATES[0].full);
  const [rescheduleSlot, setRescheduleSlot] = useState<string | null>(null);

  const { data: appt, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(apptId),
    enabled: !!id,
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', appt?.doctor_id, rescheduleDate],
    queryFn: () => getDoctorSlots(appt!.doctor_id, rescheduleDate),
    enabled: showRescheduleSheet && !!appt?.doctor_id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['appointment', id] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(apptId, 'Cancelled by patient'),
    onSuccess: () => {
      invalidate();
      router.back();
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      rescheduleAppointment(apptId, {
        appointment_date: rescheduleDate,
        start_time: rescheduleSlot!,
      }),
    onSuccess: () => {
      triggerHaptic('medium');
      setShowRescheduleSheet(false);
      setRescheduleSlot(null);
      invalidate();
    },
    onError: () => Alert.alert('Could not reschedule', 'Please pick another date or time slot.'),
  });

  const rebookMutation = useMutation({
    mutationFn: () => quickRebook(apptId),
    onSuccess: (result) => {
      triggerHaptic('medium');
      setShowRebookConfirm(false);
      setRebookResult(result);
      invalidate();
    },
    onError: () => {
      setShowRebookConfirm(false);
      Alert.alert('No slots available', 'Could not find an open slot with this doctor in the next 60 days.');
    },
  });

  const handleCancel = () => {
    Alert.alert('Cancel appointment?', 'This cannot be undone. You may need to book again later.', [
      { text: 'Keep appointment', style: 'cancel' },
      { text: 'Cancel appointment', style: 'destructive', onPress: () => cancelMutation.mutate() },
    ]);
  };

  const openReschedule = () => {
    setRescheduleDate(appt?.appointment_date ?? DATES[0].full);
    setRescheduleSlot(null);
    setShowRescheduleSheet(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Appointment" role="patient" />
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  if (error || !appt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Appointment" role="patient" />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  const doctorName = formatDoctorName(appt.doctor?.full_name);
  const statusStyle = getStatusStyle(appt.status, colors);
  const statusIcon = STATUS_ICONS[appt.status.toLowerCase()] ?? 'ellipse-outline';
  const canModify = ['pending', 'confirmed', 'scheduled'].includes(appt.status.toLowerCase());
  const slots = slotsData?.slots?.filter((s) => s.start_time) ?? [];

  const FooterWrap = Platform.OS === 'ios' ? BlurView : View;
  const footerWrapProps =
    Platform.OS === 'ios'
      ? { intensity: 72, tint: 'light' as const }
      : { style: { backgroundColor: colors.background } };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Appointment Details" role="patient" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (canModify ? 120 : 32) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.heroCard, LuminaShadow.md, { backgroundColor: colors.surface }]}>
          <View style={[styles.heroAccent, { backgroundColor: statusStyle.color }]} />
          <View style={styles.heroInner}>
            <View style={[styles.avatar, { backgroundColor: colors.coralSoft }]}>
              <Text style={[styles.avatarText, { color: colors.coral }]}>{getInitials(doctorName)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Ionicons name={statusIcon} size={11} color={statusStyle.color} />
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {appt.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text style={[styles.doctorName, { color: colors.text }]}>{doctorName}</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Your upcoming visit</Text>
          </View>
        </View>

        {/* Date & time highlight */}
        <View style={[styles.datetimeCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
          <View style={styles.datetimeRow}>
            <View style={[styles.datetimeIcon, { backgroundColor: colors.coralSoft }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.datetimeLabel, { color: colors.textMuted }]}>DATE</Text>
              <Text style={[styles.datetimeValue, { color: colors.text }]}>
                {formatFullDate(appt.appointment_date)}
              </Text>
            </View>
          </View>
          <View style={[styles.datetimeDivider, { backgroundColor: colors.border }]} />
          <View style={styles.datetimeRow}>
            <View style={[styles.datetimeIcon, { backgroundColor: colors.coralSoft }]}>
              <Ionicons name="time-outline" size={20} color={colors.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.datetimeLabel, { color: colors.textMuted }]}>TIME</Text>
              <Text style={[styles.datetimeValueMono, { color: colors.text }]}>
                {formatDisplayTime(appt.start_time)} – {formatDisplayTime(appt.end_time)}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <Text style={[styles.outsideSectionLabel, { color: colors.textSecondary }]}>Visit details</Text>
        <View style={[styles.detailsCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
          <InfoRow
            icon="document-text-outline"
            label="Reason"
            value={appt.reason ?? 'Routine consultation'}
            colors={colors}
            isLast={!appt.notes && !appt.cancellation_reason}
          />
          {appt.notes ? (
            <InfoRow icon="chatbubble-outline" label="Notes" value={appt.notes} colors={colors} isLast={!appt.cancellation_reason} />
          ) : null}
          {appt.cancellation_reason ? (
            <InfoRow icon="close-circle-outline" label="Cancellation" value={appt.cancellation_reason} colors={colors} isLast />
          ) : null}
        </View>

        {canModify ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.coral, marginLeft: 4 }]}>MANAGE</Text>
            <View style={styles.actionRow}>
              <ActionTile
                icon="calendar-outline"
                label="Reschedule"
                sublabel="Pick a new date & time for this visit"
                iconBg={colors.coralSoft}
                iconColor={colors.coral}
                onPress={openReschedule}
                colors={colors}
              />
              <ActionTile
                icon="flash-outline"
                label="Quick Rebook"
                sublabel="Book next open slot with same doctor"
                iconBg={colors.tealSoft}
                iconColor={colors.teal}
                onPress={() => setShowRebookConfirm(true)}
                colors={colors}
              />
            </View>
          </>
        ) : null}

        <View style={[styles.tipBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.teal} />
          <Text style={[styles.tipText, { color: colors.teal }]}>
            {canModify
              ? 'Reschedule updates this appointment. Quick Rebook creates a separate new booking.'
              : 'This appointment can no longer be changed.'}
          </Text>
        </View>
      </ScrollView>

      {canModify ? (
        <FooterWrap
          {...footerWrapProps}
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopColor: colors.border,
            },
            Platform.OS !== 'ios' && { backgroundColor: colors.background },
          ]}
        >
          <Pressable
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
            style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.errorText} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={16} color={colors.errorText} />
                <Text style={[styles.cancelText, { color: colors.errorText }]}>Cancel appointment</Text>
              </>
            )}
          </Pressable>
        </FooterWrap>
      ) : null}

      {/* Reschedule sheet */}
      <BottomSheet
        visible={showRescheduleSheet}
        onClose={() => setShowRescheduleSheet(false)}
        height={560}
        maxHeight="88%"
      >
        <View style={styles.sheetBody}>
          <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Reschedule visit</Text>
            <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
              Choose a new date and time with {doctorName}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowRescheduleSheet(false)}
            hitSlop={8}
            style={[styles.closeBtn, { backgroundColor: colors.neutral100 }]}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sheetSection, { color: colors.coral }]}>SELECT DATE</Text>
          <DateStrip
            dates={DATES}
            selected={rescheduleDate}
            onSelect={(date) => {
              setRescheduleDate(date);
              setRescheduleSlot(null);
            }}
            role="patient"
          />

          <Text style={[styles.sheetSection, { color: colors.coral, marginTop: LuminaSpacing.md }]}>
            SELECT TIME
          </Text>
          {loadingSlots ? (
            <ActivityIndicator color={colors.coral} style={{ marginVertical: 24 }} />
          ) : (
            <SlotGrid
              slots={slots}
              selected={rescheduleSlot}
              onSelect={setRescheduleSlot}
              role="patient"
            />
          )}
        </ScrollView>

        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => rescheduleMutation.mutate()}
            disabled={!rescheduleSlot || rescheduleMutation.isPending}
            style={[
              styles.sheetCta,
              {
                backgroundColor: rescheduleSlot ? colors.coral : colors.neutral100,
              },
              rescheduleSlot && styles.sheetCtaShadow,
            ]}
          >
            {rescheduleMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={rescheduleSlot ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.sheetCtaText,
                    { color: rescheduleSlot ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  Confirm new time
                </Text>
              </>
            )}
          </Pressable>
        </View>
        </View>
      </BottomSheet>

      {/* Quick rebook confirm */}
      <BottomSheet visible={showRebookConfirm} onClose={() => setShowRebookConfirm(false)} height={320}>
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Quick rebook</Text>
            <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
              We'll find the next available slot with {doctorName}
            </Text>
          </View>
        </View>
        <View style={styles.rebookBody}>
          <View style={[styles.rebookIconWrap, { backgroundColor: colors.tealSoft }]}>
            <Ionicons name="flash-outline" size={32} color={colors.teal} />
          </View>
          <Text style={[styles.rebookDesc, { color: colors.textSecondary }]}>
            This keeps your current appointment and books an additional visit at the earliest open time.
          </Text>
        </View>
        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <View style={styles.sheetBtnRow}>
            <Pressable
              onPress={() => setShowRebookConfirm(false)}
              style={[styles.sheetSecBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.sheetSecText, { color: colors.textSecondary }]}>Not now</Text>
            </Pressable>
            <Pressable
              onPress={() => rebookMutation.mutate()}
              disabled={rebookMutation.isPending}
              style={[styles.sheetPriBtn, { backgroundColor: colors.teal }]}
            >
              {rebookMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sheetPriText}>Find next slot</Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Quick rebook success */}
      <BottomSheet
        visible={!!rebookResult}
        onClose={() => setRebookResult(null)}
        height={380}
      >
        <View style={styles.rebookSuccessBody}>
          <View style={[styles.rebookSuccessIcon, { backgroundColor: colors.tealSoft }]}>
            <Ionicons name="checkmark-circle" size={40} color={colors.teal} />
          </View>
          <Text style={[styles.rebookSuccessTitle, { color: colors.text }]}>New appointment booked</Text>
          {rebookResult ? (
            <>
              <Text style={[styles.rebookSuccessDate, { color: colors.text }]}>
                {formatFullDate(rebookResult.appointment_date)}
              </Text>
              <Text style={[styles.rebookSuccessTime, { color: colors.coral }]}>
                {formatDisplayTime(rebookResult.start_time)} – {formatDisplayTime(rebookResult.end_time)}
              </Text>
              <Text style={[styles.rebookSuccessSub, { color: colors.textSecondary }]}>
                with {doctorName}
              </Text>
            </>
          ) : null}
        </View>
        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <View style={styles.sheetBtnRow}>
            <Pressable
              onPress={() => setRebookResult(null)}
              style={[styles.sheetSecBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.sheetSecText, { color: colors.textSecondary }]}>Done</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const newId = rebookResult?.new_appointment_id;
                setRebookResult(null);
                if (newId) router.replace(`/(patient)/appointments/${newId}`);
              }}
              style={[styles.sheetPriBtn, { backgroundColor: colors.coral }]}
            >
              <Text style={styles.sheetPriText}>View appointment</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.sm,
    gap: LuminaSpacing.lg,
  },
  heroCard: {
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  heroAccent: { height: 4 },
  heroInner: { alignItems: 'center', padding: LuminaSpacing.xl, gap: 6 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 24 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
  },
  statusText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  doctorName: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  datetimeCard: {
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  datetimeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  datetimeIcon: {
    width: 44,
    height: 44,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datetimeLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  datetimeValue: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15, lineHeight: 20 },
  datetimeValueMono: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 16, letterSpacing: -0.3 },
  datetimeDivider: { height: StyleSheet.hairlineWidth, marginVertical: LuminaSpacing.md },
  outsideSectionLabel: {
    fontFamily: LuminaFontFamily.nunitoSemiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    marginBottom: -4,
  },
  detailsCard: {
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: LuminaSpacing.lg,
    paddingTop: 4,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
  },
  cancelText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },

  sheetBody: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
    gap: 12,
  },
  sheetTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20 },
  sheetHint: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: LuminaSpacing.md },
  sheetSection: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sheetFooter: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
  },
  sheetCtaShadow: {
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  sheetCtaText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16 },
  sheetBtnRow: { flexDirection: 'row', gap: 10 },
  sheetSecBtn: {
    flex: 1,
    height: 48,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  sheetPriBtn: {
    flex: 2,
    height: 48,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPriText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15, color: '#FFFFFF' },
  rebookBody: { alignItems: 'center', paddingHorizontal: LuminaSpacing.xxl, gap: 12, flex: 1 },
  rebookIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookDesc: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  rebookSuccessBody: { alignItems: 'center', paddingHorizontal: LuminaSpacing.xxl, paddingTop: LuminaSpacing.lg, gap: 6, flex: 1 },
  rebookSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rebookSuccessTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20, textAlign: 'center' },
  rebookSuccessDate: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15, textAlign: 'center', marginTop: 4 },
  rebookSuccessTime: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 18, textAlign: 'center' },
  rebookSuccessSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, textAlign: 'center', marginTop: 2 },
});
