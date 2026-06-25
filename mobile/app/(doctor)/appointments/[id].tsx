import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  getAppointment,
  rescheduleAppointment,
} from '@/api/appointments';
import { listDoctorNotes } from '@/api/doctorNotes';
import { formatTime12 } from '@/api/types';
import { openPhoneDialer } from '@/utils/phone';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaInput } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { getStatusStyle } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pending: 'time-outline',
  confirmed: 'checkmark-circle-outline',
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

function InfoRow({
  icon,
  label,
  value,
  valueColor,
  borderColor,
  isLast,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  borderColor: string;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const content = (
    <>
      <View style={[infoS.iconWrap, { backgroundColor: colors.tealSoft }]}>
        <Ionicons name={icon} size={15} color={colors.teal} />
      </View>
      <View style={infoS.texts}>
        <Text style={[infoS.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[infoS.value, { color: valueColor ?? colors.text }]} numberOfLines={3}>
          {value}
        </Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={15} color={colors.textMuted} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[infoS.row, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[infoS.row, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
      {content}
    </View>
  );
}

const infoS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: LuminaSpacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texts: { flex: 1, minWidth: 0 },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11, marginBottom: 1 },
  value: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
});

function QuickAction({
  icon,
  label,
  iconBg,
  iconColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
}) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={[quickS.tile, { backgroundColor: colors.surface }, LuminaShadow.sm]}
    >
      <View style={[quickS.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[quickS.label, { color: colors.text }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const quickS = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: LuminaSpacing.md,
    paddingHorizontal: LuminaSpacing.xs,
    borderRadius: LuminaRadius.lg,
    gap: 6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11, textAlign: 'center' },
});

export default function DoctorAppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'doctor' });

  const [completeNotes, setCompleteNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [showRescheduleSheet, setShowRescheduleSheet] = useState(false);

  const apptId = parseInt(id!, 10);

  const { data: appt, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(apptId),
    enabled: !!id,
  });

  const { data: notes } = useQuery({
    queryKey: ['doctor-notes', appt?.patient_id],
    queryFn: () => listDoctorNotes({ patient_id: appt!.patient_id }),
    enabled: !!appt?.patient_id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['appointment', id] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => confirmAppointment(apptId),
    onSuccess: () => { invalidate(); Alert.alert('Confirmed', 'Appointment confirmed.'); },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeAppointment(apptId, completeNotes || undefined),
    onSuccess: () => {
      setShowCompleteSheet(false);
      invalidate();
      router.replace({ pathname: '/(doctor)/success', params: { type: 'appointment_completed' } });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(apptId, 'Cancelled by doctor'),
    onSuccess: () => { invalidate(); router.back(); },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => rescheduleAppointment(apptId, { appointment_date: rescheduleDate, start_time: rescheduleTime }),
    onSuccess: () => {
      setShowRescheduleSheet(false);
      invalidate();
      Alert.alert('Rescheduled', 'Appointment updated.');
    },
    onError: () => Alert.alert('Error', 'Use YYYY-MM-DD and HH:MM:SS format.'),
  });

  if (isLoading) return <><ScreenHeader title="Appointment" role="doctor" /><LoadingSkeleton count={3} /></>;
  if (error || !appt) return <><ScreenHeader title="Appointment" role="doctor" /><ErrorState onRetry={refetch} /></>;

  const status = appt.status.toLowerCase();
  const statusStyle = getStatusStyle(status, colors);
  const isActionable = status === 'pending' || status === 'confirmed';
  const isHistory = status === 'completed' || status === 'cancelled';
  const patientId = appt.patient_id;
  const patientName = appt.patient?.full_name ?? 'Patient';
  const initials = patientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const apptNotes = (notes ?? []).filter((n) => n.appointment_id === appt.id).slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Appointment Details" role="doctor" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (isActionable ? 120 : 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner for history appointments */}
        {isHistory ? (
          <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={STATUS_ICONS[status] ?? 'information-circle-outline'} size={20} color={statusStyle.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusBannerTitle, { color: statusStyle.color }]}>
                {status === 'completed' ? 'Appointment Completed' : 'Appointment Cancelled'}
              </Text>
              <Text style={[styles.statusBannerSub, { color: statusStyle.color }]}>
                {status === 'completed'
                  ? 'This visit is in your history. Clinical actions are read-only.'
                  : 'This appointment was cancelled and cannot be modified.'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Patient card */}
        <SectionCard surfaceColor={colors.surface}>
          <View style={styles.patientRow}>
            <View style={[styles.avatar, { backgroundColor: colors.tealSoft }]}>
              <Text style={[styles.avatarText, { color: colors.teal }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>{patientName}</Text>
              <Text style={[styles.patientMeta, { color: colors.textSecondary }]}>
                {appt.appointment_date} · {formatTime12(appt.start_time)}
              </Text>
              {appt.patient?.phone ? (
                <Pressable
                  style={styles.phoneRow}
                  onPress={() => appt.patient?.phone && openPhoneDialer(appt.patient.phone)}
                >
                  <Ionicons name="call-outline" size={13} color={colors.teal} />
                  <Text style={{ color: colors.teal, fontSize: 12, fontFamily: LuminaFontFamily.dmSansMedium }}>
                    {appt.patient.phone}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={() => router.push(`/(doctor)/patients/${patientId}` as never)}>
              <Text style={{ color: colors.teal, fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 12 }}>
                Profile →
              </Text>
            </Pressable>
          </View>
        </SectionCard>

        {/* Appointment details */}
        <SectionCard label="APPOINTMENT DETAILS" surfaceColor={colors.surface}>
          <View style={[styles.statusPillRow, { marginBottom: LuminaSpacing.md }]}>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusPillText, { color: statusStyle.color }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>
          <InfoRow
            icon="calendar-outline"
            label="Date"
            value={formatFullDate(appt.appointment_date)}
            borderColor={colors.border}
          />
          <InfoRow
            icon="time-outline"
            label="Time"
            value={`${formatTime12(appt.start_time)} – ${formatTime12(appt.end_time)}`}
            borderColor={colors.border}
          />
          <InfoRow
            icon="document-text-outline"
            label="Reason"
            value={appt.reason ?? 'General consultation'}
            borderColor={colors.border}
          />
          {appt.notes ? (
            <InfoRow icon="create-outline" label="Notes" value={appt.notes} borderColor={colors.border} isLast />
          ) : (
            <InfoRow
              icon="pulse-outline"
              label="Visit type"
              value={isHistory ? 'Past visit' : 'Upcoming visit'}
              borderColor={colors.border}
              isLast
            />
          )}
        </SectionCard>

        {/* Quick actions — only for active appointments */}
        {isActionable ? (
          <View style={styles.quickRow}>
            <QuickAction
              icon="person-outline"
              label="Patient"
              iconBg={colors.tealSoft}
              iconColor={colors.teal}
              onPress={() => router.push(`/(doctor)/patients/${patientId}` as never)}
            />
            <QuickAction
              icon="medkit-outline"
              label="Prescription"
              iconBg="#FEF0EB"
              iconColor={colors.coral}
              onPress={() => router.push({
                pathname: '/(doctor)/prescriptions/create',
                params: { patientId: String(patientId), appointmentId: String(appt.id) },
              })}
            />
            <QuickAction
              icon="document-text-outline"
              label="Add Note"
              iconBg="#E0F2FE"
              iconColor="#0369A1"
              onPress={() => router.push({
                pathname: '/(doctor)/notes/create',
                params: { patientId: String(patientId), appointmentId: String(appt.id) },
              })}
            />
          </View>
        ) : null}

        {/* Clinical notes */}
        <SectionCard label="CLINICAL NOTES" surfaceColor={colors.surface}>
          {apptNotes.length === 0 ? (
            <Text style={[styles.emptyMeta, { color: colors.textSecondary }]}>No notes added yet.</Text>
          ) : (
            apptNotes.map((note, i) => (
              <View
                key={note.id}
                style={[styles.noteRow, i < apptNotes.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
                <Text style={[styles.noteBody, { color: colors.textSecondary }]} numberOfLines={2}>{note.content}</Text>
              </View>
            ))
          )}
          {isActionable ? (
            <Pressable
              onPress={() => router.push({
                pathname: '/(doctor)/notes/create',
                params: { patientId: String(patientId), appointmentId: String(appt.id) },
              })}
              style={{ paddingTop: LuminaSpacing.md }}
            >
              <Text style={{ color: colors.teal, fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 }}>
                + Add note
              </Text>
            </Pressable>
          ) : null}
        </SectionCard>

        <Text style={[styles.dpdpa, { color: colors.textSecondary }]}>
          Patient data access is logged for DPDPA 2023 compliance.
        </Text>
      </ScrollView>

      {/* Bottom action bar — status-specific */}
      {isActionable ? (
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
          {status === 'pending' ? (
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btnOutline, { borderColor: colors.teal }]}
                onPress={() => setShowRescheduleSheet(true)}
              >
                <Text style={[styles.btnOutlineText, { color: colors.teal }]}>Reschedule</Text>
              </Pressable>
              <Pressable
                style={[styles.btnFill, { backgroundColor: colors.teal, flex: 1.4 }]}
                onPress={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.btnFillText}>Confirm</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btnOutline, { borderColor: colors.error, flex: 0.9 }]}
                onPress={() => Alert.alert('Cancel?', 'The patient will be notified.', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
                ])}
              >
                <Text style={[styles.btnOutlineText, { color: colors.error, fontSize: 13 }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btnOutline, { borderColor: colors.teal, flex: 1 }]}
                onPress={() => setShowRescheduleSheet(true)}
              >
                <Text style={[styles.btnOutlineText, { color: colors.teal, fontSize: 13 }]}>Reschedule</Text>
              </Pressable>
              <Pressable
                style={[styles.btnFill, { backgroundColor: '#12B76A', flex: 1.3 }]}
                onPress={() => setShowCompleteSheet(true)}
              >
                <Ionicons name="checkmark-done-outline" size={18} color="#FFF" />
                <Text style={[styles.btnFillText, { fontSize: 13 }]}>Complete</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}

      {/* Complete sheet */}
      <BottomSheet visible={showCompleteSheet} onClose={() => setShowCompleteSheet(false)} height={320}>
        <View style={{ padding: LuminaSpacing.xl, gap: LuminaSpacing.md }}>
          <Text style={styles.sheetTitle}>Mark as complete</Text>
          <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
            Add optional completion notes for this visit.
          </Text>
          <LuminaInput
            label="Completion notes (optional)"
            value={completeNotes}
            onChangeText={setCompleteNotes}
            multiline
            placeholder="Summary of visit, follow-up advice..."
          />
          <Pressable
            style={[styles.btnFill, { backgroundColor: '#12B76A' }]}
            onPress={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnFillText}>Mark Complete</Text>
            )}
          </Pressable>
        </View>
      </BottomSheet>

      {/* Reschedule sheet */}
      <BottomSheet visible={showRescheduleSheet} onClose={() => setShowRescheduleSheet(false)} height={340}>
        <View style={{ padding: LuminaSpacing.xl, gap: LuminaSpacing.md }}>
          <Text style={styles.sheetTitle}>Reschedule appointment</Text>
          <LuminaInput
            label="New date"
            value={rescheduleDate}
            onChangeText={setRescheduleDate}
            placeholder="YYYY-MM-DD"
          />
          <LuminaInput
            label="New start time"
            value={rescheduleTime}
            onChangeText={setRescheduleTime}
            placeholder="HH:MM:SS (e.g. 10:00:00)"
          />
          <Pressable
            style={[styles.btnFill, { backgroundColor: colors.teal }]}
            onPress={() => rescheduleMutation.mutate()}
            disabled={rescheduleMutation.isPending || !rescheduleDate || !rescheduleTime}
          >
            {rescheduleMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnFillText}>Save New Time</Text>
            )}
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.md },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LuminaSpacing.md,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.lg,
    marginBottom: LuminaSpacing.md,
  },
  statusBannerTitle: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, marginBottom: 2 },
  statusBannerSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, lineHeight: 17 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 18 },
  patientName: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 17 },
  patientMeta: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusPillRow: { flexDirection: 'row' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  statusPillText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11, textTransform: 'uppercase' },
  quickRow: { flexDirection: 'row', gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.md },
  emptyMeta: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },
  noteRow: { paddingVertical: LuminaSpacing.sm },
  noteTitle: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  noteBody: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  dpdpa: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: LuminaSpacing.lg,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btnRow: { flexDirection: 'row', gap: LuminaSpacing.sm },
  btnOutline: {
    flex: 1,
    height: 50,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnOutlineText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  btnFill: {
    flex: 1,
    height: 50,
    borderRadius: LuminaRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  btnFillText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15, color: '#FFFFFF' },
  sheetTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 18 },
  sheetSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, lineHeight: 18 },
});
