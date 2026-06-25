import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatFullDate, getPatientDisplayName } from '../../../utils/format';

// ─── API ──────────────────────────────────────────────────────────
const fetchSlots = (doctorId, date) =>
  apiFetch(`/appointments/doctors/${doctorId}/slots?appointment_date=${date}`);

const rescheduleAppointment = (id, payload) =>
  apiFetch(`/appointments/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const fetchAppointment = (id) => apiFetch(`/appointments/${id}`);

// ─── Date strip ───────────────────────────────────────────────────
function DateStrip({ selectedDate, onSelect, colors }) {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 2, paddingBottom: 4 }}
    >
      {days.map((d) => {
        const iso = d.toISOString().split('T')[0];
        const isSelected = selectedDate === iso;
        const isToday = i === 0;

        return (
          <TouchableOpacity
            key={iso}
            style={[
              stripStyles.cell,
              {
                backgroundColor: isSelected ? colors.teal : colors.surface,
                borderColor: isSelected ? colors.teal : colors.border,
              },
            ]}
            onPress={() => onSelect(iso)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                stripStyles.dayName,
                { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
              ]}
            >
              {dayNames[d.getDay()]}
            </Text>
            <Text
              style={[
                stripStyles.dayNum,
                { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                isSelected && { fontFamily: FontFamily.dmMonoMedium },
              ]}
            >
              {d.getDate()}
            </Text>
            {isToday && !isSelected && (
              <View style={[stripStyles.todayDot, { backgroundColor: colors.teal }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const stripStyles = StyleSheet.create({
  cell: {
    width: 52,
    height: 68,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  dayName: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },
  dayNum: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 16,
    lineHeight: 20,
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

// ─── Slot grid ────────────────────────────────────────────────────
function SlotGrid({ slots, selectedSlot, onSelect, currentSlot, colors }) {
  if (!slots || slots.length === 0) {
    return (
      <View style={slotStyles.empty}>
        <Text style={[slotStyles.emptyText, { color: colors.textSecondary }]}>
          No available slots on this date
        </Text>
      </View>
    );
  }

  return (
    <View style={slotStyles.grid}>
      {slots.map((slot) => {
        const isCurrent   = slot.start_time === currentSlot;
        const isSelected  = selectedSlot === slot.start_time;
        const isAvailable = slot.is_available !== false;

        let bg, border, textColor;
        if (isCurrent) {
          bg = colors.warningBg;
          border = colors.warning;
          textColor = colors.warning;
        } else if (isSelected) {
          bg = colors.teal;
          border = colors.teal;
          textColor = '#FFFFFF';
        } else if (!isAvailable) {
          bg = colors.neutral100 ?? '#F1F3F5';
          border = colors.border;
          textColor = colors.textSecondary;
        } else {
          bg = colors.surface;
          border = colors.border;
          textColor = colors.textPrimary;
        }

        return (
          <TouchableOpacity
            key={slot.start_time}
            style={[slotStyles.slot, { backgroundColor: bg, borderColor: border }]}
            onPress={() => isAvailable && !isCurrent && onSelect(slot.start_time)}
            disabled={!isAvailable || isCurrent}
            activeOpacity={0.8}
          >
            <Text
              style={[
                slotStyles.slotText,
                { color: textColor },
                !isAvailable && { textDecorationLine: 'line-through' },
              ]}
            >
              {slot.start_time?.slice(0, 5)}
            </Text>
            {isCurrent && (
              <Text style={[slotStyles.currentLabel, { color: colors.warning }]}>
                Current
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const slotStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: '30%',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: FontSize.sm,
  },
  currentLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs - 1,
    marginTop: 1,
  },
  empty: {
    paddingVertical: Spacing[5],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
});

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ text, colors }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.teal }]}>{text}</Text>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function RescheduleScreen({ navigation, route }) {
  const { appointmentId } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason]             = useState('');
  const [reasonFocused, setReasonFocused] = useState(false);

  // ── Fetch appointment ──
  const { data: appt, isLoading: loadingAppt } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
    enabled: !!appointmentId,
  });

  // ── Fetch slots ──
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', appt?.doctor_id, selectedDate],
    queryFn: () => fetchSlots(appt.doctor_id, selectedDate),
    enabled: !!appt?.doctor_id && !!selectedDate,
  });

  const slots = slotsData?.slots ?? slotsData ?? [];

  // ── Reschedule mutation ──
  const rescheduleMutation = useMutation({
    mutationFn: () =>
      rescheduleAppointment(appointmentId, {
        appointment_date: selectedDate,
        start_time:       selectedSlot,
        reason:           reason.trim() || 'Rescheduled by doctor',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] });
      queryClient.invalidateQueries({ queryKey: ['appts-upcoming'] });
      Alert.alert(
        'Rescheduled',
        'Appointment has been rescheduled. The patient will be notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (err) => {
      Alert.alert(
        'Failed',
        err.code === 409
          ? 'This slot was just taken. Please choose another time.'
          : err.message ?? 'Could not reschedule. Please try again.',
      );
    },
  });

  const canConfirm = selectedDate && selectedSlot && !rescheduleMutation.isPending;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Reschedule Appointment
          </Text>
          {appt && (appt.patient?.full_name || appt.patient_name) && (
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {getPatientDisplayName(appt)}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current appointment info */}
        {appt && (
          <View style={[styles.currentCard, { backgroundColor: colors.tealLight }]}>
            <Ionicons name="time-outline" size={16} color={colors.teal} />
            <Text style={[styles.currentText, { color: colors.tealDark ?? colors.teal }]}>
              Currently:{' '}
              <Text style={{ fontFamily: FontFamily.dmSansSemiBold }}>
                {appt.appointment_date
                  ? formatFullDate(appt.appointment_date)
                  : '—'}{' '}
                {appt.start_time ? `at ${appt.start_time.slice(0, 5)}` : ''}
              </Text>
            </Text>
          </View>
        )}

        {/* Warning */}
        <View style={[styles.warnCard, { backgroundColor: colors.warningBg, borderColor: colors.warning + '40' }]}>
          <Ionicons name="information-circle-outline" size={15} color={colors.warning} />
          <Text style={[styles.warnText, { color: colors.warning }]}>
            Changing the appointment will notify the patient.
          </Text>
        </View>

        {/* Date picker */}
        <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
          <SectionLabel text="SELECT NEW DATE" colors={colors} />
          <DateStrip
            selectedDate={selectedDate}
            onSelect={(date) => { setSelectedDate(date); setSelectedSlot(''); }}
            colors={colors}
          />
        </View>

        {/* Time slots */}
        <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
          <SectionLabel text="SELECT TIME SLOT" colors={colors} />
          {loadingSlots ? (
            <View style={styles.slotsLoading}>
              <ActivityIndicator color={colors.teal} size="small" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading slots...
              </Text>
            </View>
          ) : (
            <SlotGrid
              slots={slots}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
              currentSlot={appt?.start_time}
              colors={colors}
            />
          )}
        </View>

        {/* Reason */}
        <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
          <SectionLabel text="REASON FOR RESCHEDULING" colors={colors} />
          <View
            style={[
              styles.reasonInput,
              {
                backgroundColor: colors.bg,
                borderColor: reasonFocused ? colors.teal : colors.border,
                borderWidth: reasonFocused ? 1.5 : 1,
              },
            ]}
          >
            <TextInput
              style={[
                styles.reasonText,
                { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular },
              ]}
              placeholder="Optional — e.g. Doctor unavailable on original date"
              placeholderTextColor={colors.textSecondary}
              value={reason}
              onChangeText={setReason}
              onFocus={() => setReasonFocused(true)}
              onBlur={() => setReasonFocused(false)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { backgroundColor: canConfirm ? colors.coral : colors.border },
          ]}
          onPress={() => rescheduleMutation.mutate()}
          disabled={!canConfirm}
          activeOpacity={0.88}
        >
          {rescheduleMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Reschedule</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.notifyNote, { color: colors.textSecondary }]}>
          Patient will be notified of this change.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    gap: Spacing[2],
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
  },
  headerSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },

  // ── Scroll ──
  scroll: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
  },

  // ── Current card ──
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginBottom: Spacing[3],
  },
  currentText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    flex: 1,
  },

  // ── Warning ──
  warnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing[3],
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  warnText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    flex: 1,
  },

  // ── Card ──
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  sectionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },

  // ── Slots loading ──
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing[4],
  },
  loadingText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },

  // ── Reason ──
  reasonInput: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    minHeight: 72,
  },
  reasonText: {
    fontSize: FontSize.base,
    lineHeight: 22,
    minHeight: 52,
  },

  // ── Action bar ──
  actionBar: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8],
    borderTopWidth: 1,
  },
  confirmBtn: {
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  confirmBtnText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.md,
    color: '#FFFFFF',
  },
  notifyNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});