import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatFullDate, formatTime, formatShortDate, formatPhone } from '../../../utils/format';
import CompleteAppointmentSheet from './CompleteAppointmentSheet';

// ─── API ──────────────────────────────────────────────────────────
const fetchAppointment = (id) => apiFetch(`/appointments/${id}`);
const confirmAppointment = (id) =>
  apiFetch(`/appointments/${id}/confirm`, { method: 'POST' });
const cancelAppointment = (id, reason) =>
  apiFetch(`/appointments/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellation_reason: reason }),
  });

// ─── Status config ────────────────────────────────────────────────
const STATUS = {
  pending:   { color: '#F79009', bg: '#FEF3C7', label: 'Pending',   icon: 'time-outline' },
  confirmed: { color: '#0BA5EC', bg: '#E0F2FE', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  completed: { color: '#12B76A', bg: '#DCFCE7', label: 'Completed', icon: 'checkmark-done-circle-outline' },
  cancelled: { color: '#F04438', bg: '#FEE2E2', label: 'Cancelled', icon: 'close-circle-outline' },
};

// ─── Info row ─────────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueColor, tappable, onPress, isLast, colors }) {
  return (
    <TouchableOpacity
      style={[
        rowStyles.row,
        { borderBottomColor: colors.border },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={tappable ? onPress : undefined}
      activeOpacity={tappable ? 0.7 : 1}
      disabled={!tappable}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: colors.tealLight }]}>
        <Ionicons name={icon} size={15} color={colors.teal} />
      </View>
      <View style={rowStyles.texts}>
        <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text
          style={[
            rowStyles.value,
            { color: valueColor ?? colors.textPrimary },
            tappable && { color: colors.teal },
          ]}
        >
          {value}
        </Text>
      </View>
      {tappable && (
        <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    gap: Spacing[3],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texts: { flex: 1 },
  label: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    marginBottom: 1,
  },
  value: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.base,
  },
});

// ─── Health chip ──────────────────────────────────────────────────
function HealthChip({ label, bg, color }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: bg }]}>
      <Text style={[chipStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  text: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
  },
});

// ─── Section card ─────────────────────────────────────────────────
function SectionCard({ label, children, colors }) {
  return (
    <View style={[secStyles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      {label && (
        <Text style={[secStyles.label, { color: colors.teal }]}>{label}</Text>
      )}
      {children}
    </View>
  );
}

const secStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  label: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },
});

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ message, type, colors }) {
  if (!message) return null;
  const bg = type === 'error' ? colors.errorBg : colors.successBg;
  const color = type === 'error' ? colors.error : colors.success;
  const icon = type === 'error' ? 'alert-circle' : 'checkmark-circle';
  return (
    <View style={[toastStyles.toast, { backgroundColor: '#1A1D27' }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={toastStyles.text}>{message}</Text>
    </View>
  );
}

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: Spacing[5],
    right: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing[4],
    borderRadius: Radius.md,
    zIndex: 999,
  },
  text: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    flex: 1,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function DoctorAppointmentDetailScreen({ navigation, route }) {
  const { appointmentId, autoAction } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [showCompleteSheet, setShowCompleteSheet] = useState(
    autoAction === 'complete'
  );
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  // ── Fetch appointment ──
  const {
    data: appt,
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
    enabled: !!appointmentId,
  });

  const onRefresh = useCallback(async () => { await refetch(); }, []);

  // ── Confirm mutation ──
  const confirmMutation = useMutation({
    mutationFn: () => confirmAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] });
      queryClient.invalidateQueries({ queryKey: ['appts-upcoming'] });
      showToast('Appointment confirmed successfully');
    },
    onError: (err) => showToast(err.message ?? 'Failed to confirm', 'error'),
  });

  // ── Cancel mutation ──
  const cancelMutation = useMutation({
    mutationFn: (reason) => cancelAppointment(appointmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] });
      showToast('Appointment cancelled');
    },
    onError: (err) => showToast(err.message ?? 'Failed to cancel', 'error'),
  });

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Appointment',
      `Confirm appointment for ${appt?.patient_name ?? 'this patient'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => confirmMutation.mutate() },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? The patient will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate('Cancelled by doctor'),
        },
      ]
    );
  };

  // ── Loading / error ──
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !appt) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Could not load appointment
          </Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={{ color: colors.teal, fontFamily: FontFamily.dmSansMedium }}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS[appt.status] ?? STATUS.pending;
  const isActionable = appt.status === 'pending' || appt.status === 'confirmed';
  const isMutating = confirmMutation.isPending || cancelMutation.isPending;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Appointment Details
          </Text>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => {}}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Body */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />
        }
      >
        {/* ── Patient card ── */}
        <SectionCard colors={colors}>
          <View style={styles.patientRow}>
            {/* Avatar */}
            <View style={[styles.patientAvatar, { backgroundColor: colors.tealLight }]}>
              <Text style={[styles.patientAvatarText, { color: colors.teal }]}>
                {(appt.patient_name ?? 'P').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.patientName, { color: colors.textPrimary }]}>
                {appt.patient_name ?? 'Patient'}
              </Text>
              <Text style={[styles.patientMeta, { color: colors.textSecondary }]}>
                {[appt.patient_age && `${appt.patient_age} yrs`, appt.patient_gender]
                  .filter(Boolean)
                  .join(' • ') || 'Patient details'}
              </Text>
              {appt.patient_phone && (
                <TouchableOpacity
                  style={styles.phoneRow}
                  onPress={() => Linking.openURL(`tel:${appt.patient_phone}`)}
                >
                  <Ionicons name="call-outline" size={13} color={colors.teal} />
                  <Text style={[styles.phoneText, { color: colors.teal }]}>
                    {formatPhone(appt.patient_phone)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* View profile link */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PatientsTab', {
                  screen: 'PatientDetail',
                  params: { patientId: appt.patient_id },
                })
              }
            >
              <Text style={[styles.viewProfile, { color: colors.teal }]}>View profile →</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* ── Appointment details ── */}
        <SectionCard label="APPOINTMENT DETAILS" colors={colors}>
          <InfoRow
            icon="calendar-outline"
            label="Date"
            value={appt.appointment_date ? formatFullDate(appt.appointment_date) : '—'}
            colors={colors}
          />
          <InfoRow
            icon="time-outline"
            label="Time"
            value={
              appt.start_time
                ? `${formatTime(appt.start_time)}${appt.end_time ? ` – ${formatTime(appt.end_time)}` : ''}`
                : '—'
            }
            colors={colors}
          />
          <InfoRow
            icon="pricetag-outline"
            label="Token"
            value={appt.token_number ? `#${appt.token_number}` : '—'}
            colors={colors}
          />
          <InfoRow
            icon="document-text-outline"
            label="Reason"
            value={appt.reason ?? 'General consultation'}
            colors={colors}
          />
          <InfoRow
            icon="pulse-outline"
            label="Status"
            value={status.label}
            valueColor={status.color}
            colors={colors}
          />
          <InfoRow
            icon="people-outline"
            label="Booked for"
            value={appt.family_member_name ?? 'Self'}
            colors={colors}
            isLast
          />
        </SectionCard>

        {/* ── Patient health snapshot ── */}
        {(appt.patient_blood_group || appt.patient_allergies || appt.patient_conditions) && (
          <SectionCard label="PATIENT HEALTH SNAPSHOT" colors={colors}>
            <View style={styles.healthChips}>
              {appt.patient_blood_group && (
                <HealthChip
                  label={`Blood: ${appt.patient_blood_group}`}
                  bg={colors.tealLight}
                  color={colors.teal}
                />
              )}
              {appt.patient_allergies && (
                <HealthChip
                  label={`Allergy: ${appt.patient_allergies}`}
                  bg="#FEF3C7"
                  color="#B45309"
                />
              )}
              {appt.patient_conditions && (
                <HealthChip
                  label={appt.patient_conditions}
                  bg="#FEE2E2"
                  color="#B91C1C"
                />
              )}
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PatientsTab', {
                  screen: 'PatientHistory',
                  params: { patientId: appt.patient_id },
                })
              }
            >
              <Text style={[styles.viewHistory, { color: colors.teal }]}>
                View full history →
              </Text>
            </TouchableOpacity>
          </SectionCard>
        )}

        {/* ── Notes ── */}
        <SectionCard label="APPOINTMENT NOTES" colors={colors}>
          <Text style={[styles.emptyMeta, { color: colors.textSecondary }]}>
            No notes added yet.
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ClinicalTab', {
                screen: 'CreateNote',
                params: { appointmentId: appt.id, patientId: appt.patient_id },
              })
            }
          >
            <Text style={[styles.addLink, { color: colors.teal }]}>+ Add note</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Prescription ── */}
        <SectionCard label="PRESCRIPTION" colors={colors}>
          <Text style={[styles.emptyMeta, { color: colors.textSecondary }]}>
            No prescription written.
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ClinicalTab', {
                screen: 'CreatePrescription',
                params: { appointmentId: appt.id, patientId: appt.patient_id },
              })
            }
          >
            <Text style={[styles.addLink, { color: colors.teal }]}>+ Write prescription</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* DPDPA note */}
        <Text style={[styles.dpdpaNote, { color: colors.textSecondary }]}>
          Patient data access is logged for DPDPA 2023 compliance.
        </Text>

        {/* Bottom padding for action bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom action bar ── */}
      {isActionable && (
        <View
          style={[
            styles.actionBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          {appt.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.btnOutline, { borderColor: colors.teal, flex: 1 }]}
                onPress={() => navigation.navigate('Reschedule', { appointmentId: appt.id })}
                disabled={isMutating}
              >
                <Text style={[styles.btnOutlineText, { color: colors.teal }]}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnFill, { backgroundColor: colors.teal, flex: 1.4 }]}
                onPress={handleConfirm}
                disabled={isMutating}
              >
                {confirmMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.btnFillText}>Confirm Appointment</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {appt.status === 'confirmed' && (
            <>
              <TouchableOpacity
                style={[styles.btnOutline, { borderColor: colors.error, flex: 1 }]}
                onPress={handleCancel}
                disabled={isMutating}
              >
                <Text style={[styles.btnOutlineText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnOutline, { borderColor: colors.teal, flex: 1 }]}
                onPress={() => navigation.navigate('Reschedule', { appointmentId: appt.id })}
                disabled={isMutating}
              >
                <Text style={[styles.btnOutlineText, { color: colors.teal }]}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnFill, { backgroundColor: '#12B76A', flex: 1.4 }]}
                onPress={() => setShowCompleteSheet(true)}
                disabled={isMutating}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.btnFillText}>Mark Complete</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ── Completed / Cancelled info bar ── */}
      {!isActionable && (
        <View
          style={[
            styles.infoBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <Ionicons name={status.icon} size={18} color={status.color} />
          <Text style={[styles.infoBarText, { color: status.color }]}>
            {appt.status === 'completed'
              ? `Completed on ${formatShortDate(appt.updated_at ?? appt.appointment_date)}`
              : `Cancelled on ${formatShortDate(appt.updated_at ?? appt.appointment_date)}`}
          </Text>
        </View>
      )}

      {/* ── Complete appointment bottom sheet ── */}
      <CompleteAppointmentSheet
        visible={showCompleteSheet}
        appointment={appt}
        onClose={() => setShowCompleteSheet(false)}
        onCompleted={() => {
          setShowCompleteSheet(false);
          queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
          queryClient.invalidateQueries({ queryKey: ['appointments-today'] });
          showToast('Appointment marked as complete');
        }}
        navigation={navigation}
        colors={colors}
      />

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  errorText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
    marginTop: Spacing[2],
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  moreBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ──
  scroll: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
  },

  // ── Patient card ──
  patientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  patientAvatarText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
  },
  patientName: {
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: FontSize.md,
    marginBottom: 2,
  },
  patientMeta: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
  viewProfile: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    marginTop: 4,
  },

  // ── Health chips ──
  healthChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing[3],
  },
  viewHistory: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },

  // ── Empty states ──
  emptyMeta: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    marginBottom: Spacing[2],
  },
  addLink: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },

  // ── DPDPA ──
  dpdpaNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[4],
  },

  // ── Action bar ──
  actionBar: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    paddingBottom: Spacing[8],
    borderTopWidth: 1,
  },
  btnOutline: {
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
  btnFill: {
    height: 50,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnFillText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
    color: '#FFFFFF',
  },

  // ── Info bar ──
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing[4],
    paddingBottom: Spacing[8],
    borderTopWidth: 1,
  },
  infoBarText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
});