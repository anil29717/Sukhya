import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';

// ─── API ──────────────────────────────────────────────────────────
const createFollowUp = (payload) =>
  apiFetch('/follow-ups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const TIME_PREFERENCE_TO_SCHEDULED = {
  morning:   '09:00:00',
  afternoon: '14:00:00',
  evening:   '18:00:00',
};

// ─── Date strip ───────────────────────────────────────────────────
function DateStrip({ selectedDate, onSelect, colors }) {
  const days = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 4, paddingHorizontal: 2 }}
    >
      {days.map((d) => {
        const iso = d.toISOString().split('T')[0];
        const isSelected = selectedDate === iso;
        return (
          <TouchableOpacity
            key={iso}
            style={[
              dateS.cell,
              {
                backgroundColor: isSelected ? colors.teal : colors.surface,
                borderColor: isSelected ? colors.teal : colors.border,
              },
            ]}
            onPress={() => onSelect(iso)}
            activeOpacity={0.8}
          >
            <Text style={[dateS.dayName, { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
              {dayNames[d.getDay()]}
            </Text>
            <Text style={[dateS.dayNum, { color: isSelected ? '#FFFFFF' : colors.textPrimary }]}>
              {d.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const dateS = StyleSheet.create({
  cell: {
    width: 52,
    height: 68,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayName: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  dayNum: { fontFamily: FontFamily.dmMonoMedium, fontSize: 16 },
});

// ─── Selection chip ───────────────────────────────────────────────
function SelectChip({ label, active, color, onPress }) {
  return (
    <TouchableOpacity
      style={[
        selS.chip,
        {
          backgroundColor: active ? color : 'transparent',
          borderColor: active ? color : '#E9ECEF',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[selS.text, { color: active ? '#FFFFFF' : '#868E96' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const selS = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 9999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
});

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ text, colors }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.teal }]}>{text}</Text>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function CreateFollowUpScreen({ navigation, route }) {
  const { patientId, patientName, appointmentId } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate]   = useState('');
  const [timePreference, setTimePreference] = useState('');
  const [priority, setPriority]           = useState('routine');
  const [reason, setReason]               = useState('');
  const [patientNotes, setPatientNotes]   = useState('');
  const [sendReminder, setSendReminder]   = useState(true);
  const [reasonFocused, setReasonFocused] = useState(false);
  const [notesFocused, setNotesFocused]   = useState(false);

  const isValid = selectedDate.length > 0 && reason.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () => {
      const scheduledTime = timePreference
        ? TIME_PREFERENCE_TO_SCHEDULED[timePreference]
        : undefined;

      return createFollowUp({
        patient_id:            patientId,
        source_appointment_id: appointmentId ?? undefined,
        scheduled_date:        selectedDate,
        scheduled_time:        scheduledTime,
        reason:                reason.trim(),
        notes:                 patientNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-followups'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
      navigation.goBack();
    },
    onError: (err) => {
      Alert.alert('Error', err.message ?? 'Failed to schedule follow-up. Please try again.');
    },
  });

  const priorityOptions = [
    { value: 'routine',   label: 'Routine',   color: colors.teal },
    { value: 'important', label: 'Important', color: colors.warning },
    { value: 'urgent',    label: 'Urgent',    color: colors.error },
  ];

  const timeOptions = [
    { value: 'morning',   label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening',   label: 'Evening' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
            Schedule Follow-Up
          </Text>
          <TouchableOpacity
            onPress={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={colors.teal} />
            ) : (
              <Text style={[styles.saveBtn, { color: isValid ? colors.teal : colors.textSecondary }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Patient context strip */}
          {patientName && (
            <View style={[styles.contextStrip, { backgroundColor: colors.tealLight }]}>
              <View style={[styles.contextAvatar, { backgroundColor: colors.teal }]}>
                <Text style={styles.contextAvatarText}>
                  {patientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.contextFor, { color: colors.teal }]}>For: {patientName}</Text>
                {appointmentId && (
                  <Text style={[styles.contextAppt, { color: colors.tealDark ?? colors.teal }]}>
                    Appointment #{appointmentId}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Date */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="FOLLOW-UP DATE" colors={colors} />
            <DateStrip
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              colors={colors}
            />
            {!selectedDate && (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Select a date from the next 14 days
              </Text>
            )}
          </View>

          {/* Time preference */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="TIME PREFERENCE" colors={colors} />
            <View style={styles.chipsRow}>
              {timeOptions.map((t) => (
                <SelectChip
                  key={t.value}
                  label={t.label}
                  active={timePreference === t.value}
                  color={colors.teal}
                  onPress={() => setTimePreference(timePreference === t.value ? '' : t.value)}
                />
              ))}
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Exact time depends on availability
            </Text>
          </View>

          {/* Reason */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="REASON FOR FOLLOW-UP" colors={colors} />
            <View
              style={[
                styles.textareaWrap,
                {
                  borderColor: reasonFocused ? colors.teal : colors.border,
                  borderWidth: reasonFocused ? 1.5 : 1,
                },
              ]}
            >
              <TextInput
                style={[styles.textareaText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
                placeholder="e.g. Review blood test results, monitor BP levels..."
                placeholderTextColor={colors.textSecondary}
                value={reason}
                onChangeText={setReason}
                onFocus={() => setReasonFocused(true)}
                onBlur={() => setReasonFocused(false)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
            </View>
          </View>

          {/* Priority */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="PRIORITY" colors={colors} />
            <View style={styles.chipsRow}>
              {priorityOptions.map((p) => (
                <SelectChip
                  key={p.value}
                  label={p.label}
                  active={priority === p.value}
                  color={p.color}
                  onPress={() => setPriority(p.value)}
                />
              ))}
            </View>
          </View>

          {/* Notes for patient */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="NOTES FOR PATIENT" colors={colors} />
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: notesFocused ? colors.teal : colors.border,
                  borderWidth: notesFocused ? 1.5 : 1,
                },
              ]}
            >
              <TextInput
                style={[styles.inputText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
                placeholder="e.g. Please bring your latest blood test report"
                placeholderTextColor={colors.textSecondary}
                value={patientNotes}
                onChangeText={setPatientNotes}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                autoCapitalize="sentences"
              />
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              This message will be visible to the patient.
            </Text>
          </View>

          {/* Reminder toggle */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                  Send reminder to patient
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                  Patient will be notified in their Sukhya app
                </Text>
              </View>
              <Switch
                value={sendReminder}
                onValueChange={setSendReminder}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Schedule button */}
          <TouchableOpacity
            style={[
              styles.scheduleBtn,
              { backgroundColor: isValid && !mutation.isPending ? colors.coral : colors.border },
            ]}
            onPress={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            activeOpacity={0.88}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                <Text style={styles.scheduleBtnText}>Schedule Follow-Up</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Patient will be notified in their Sukhya app.
          </Text>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.nunitoBold, fontSize: 18, flex: 1, textAlign: 'center' },
  saveBtn: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },

  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },

  contextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginBottom: Spacing[3],
  },
  contextAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contextAvatarText: { fontFamily: FontFamily.nunitoBold, fontSize: 14, color: '#FFFFFF' },
  contextFor: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
  contextAppt: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginTop: 1 },

  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  sectionLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3] },

  hint: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginTop: Spacing[2] },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  textareaWrap: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    minHeight: 80,
  },
  textareaText: { fontSize: FontSize.base, lineHeight: 22, minHeight: 60 },

  inputWrap: {
    height: 52,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    justifyContent: 'center',
  },
  inputText: { fontSize: FontSize.base },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  toggleLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginBottom: 2 },
  toggleDesc: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },

  scheduleBtn: {
    height: 54,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing[3],
  },
  scheduleBtnText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.md, color: '#FFFFFF' },

  noteText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});