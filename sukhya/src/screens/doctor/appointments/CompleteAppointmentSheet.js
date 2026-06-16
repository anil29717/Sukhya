import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';

// ─── API ──────────────────────────────────────────────────────────
const completeAppointment = (id, payload) =>
  apiFetch(`/appointments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const createFollowUp = (payload) =>
  apiFetch('/follow-ups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ─── Date strip (next 14 days) ────────────────────────────────────
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
      contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
    >
      {days.map((d) => {
        const iso = d.toISOString().split('T')[0];
        const isSelected = selectedDate === iso;
        return (
          <TouchableOpacity
            key={iso}
            style={[
              dateStyles.cell,
              {
                backgroundColor: isSelected ? colors.teal : colors.bg,
                borderColor: isSelected ? colors.teal : colors.border,
              },
            ]}
            onPress={() => onSelect(iso)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                dateStyles.dayName,
                { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
              ]}
            >
              {dayNames[d.getDay()]}
            </Text>
            <Text
              style={[
                dateStyles.dayNum,
                { color: isSelected ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              {d.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const dateStyles = StyleSheet.create({
  cell: {
    width: 48,
    height: 64,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayName: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },
  dayNum: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: 16,
  },
});

// ─── Main sheet ───────────────────────────────────────────────────
export default function CompleteAppointmentSheet({
  visible,
  appointment,
  onClose,
  onCompleted,
  navigation,
  colors,
}) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [diagnosis, setDiagnosis]           = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate]     = useState('');
  const [followUpNotes, setFollowUpNotes]   = useState('');
  const [diagFocused, setDiagFocused]       = useState(false);
  const [notesFocused, setNotesFocused]     = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Complete appointment
      await completeAppointment(appointment.id, {
        notes: diagnosis.trim() || undefined,
      });

      // Create follow-up if toggled
      if (scheduleFollowUp && followUpDate) {
        await createFollowUp({
          patient_id:            appointment.patient_id,
          source_appointment_id: appointment.id,
          scheduled_date:        followUpDate,
          notes:                 followUpNotes.trim() || undefined,
        }).catch(() => {}); // don't block completion if follow-up fails
      }
    },
    onSuccess: () => {
      onCompleted?.();
      resetForm();
    },
    onError: (err) => {
      // parent will show toast
    },
  });

  const resetForm = () => {
    setDiagnosis('');
    setScheduleFollowUp(false);
    setFollowUpDate('');
    setFollowUpNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!visible && slideAnim._value >= 490) return null;

  return (
    <Modal
      visible={visible || slideAnim._value < 490}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Animated.View
          style={[sheetStyles.backdrop, { opacity: backdropOpacity }]}
          onTouchEnd={handleClose}
        />

        {/* Sheet */}
        <Animated.View
          style={[
            sheetStyles.sheet,
            { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag handle */}
          <View style={sheetStyles.handleWrap}>
            <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View style={sheetStyles.titleRow}>
              <View>
                <Text style={[sheetStyles.title, { color: colors.textPrimary }]}>
                  Complete Appointment
                </Text>
                <Text style={[sheetStyles.subtitle, { color: colors.textSecondary }]}>
                  {appointment?.patient_name ?? 'Patient'}
                  {appointment?.start_time
                    ? ` • ${appointment.start_time.slice(0, 5)}`
                    : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[sheetStyles.divider, { backgroundColor: colors.border }]} />

            {/* Diagnosis */}
            <View style={sheetStyles.section}>
              <Text style={[sheetStyles.label, { color: colors.textBody ?? colors.textPrimary }]}>
                Diagnosis / Summary{' '}
                <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.dmSansRegular }}>
                  (optional)
                </Text>
              </Text>
              <View
                style={[
                  sheetStyles.textarea,
                  {
                    backgroundColor: colors.bg,
                    borderColor: diagFocused ? colors.teal : colors.border,
                    borderWidth: diagFocused ? 1.5 : 1,
                  },
                ]}
              >
                <TextInput
                  style={[
                    sheetStyles.textareaInput,
                    { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular },
                  ]}
                  placeholder="Briefly describe the consultation outcome..."
                  placeholderTextColor={colors.textSecondary}
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  onFocus={() => setDiagFocused(true)}
                  onBlur={() => setDiagFocused(false)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Follow-up toggle */}
            <View style={sheetStyles.section}>
              <View style={sheetStyles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[sheetStyles.label, { color: colors.textPrimary }]}>
                    Follow-up required?
                  </Text>
                  <Text style={[sheetStyles.toggleDesc, { color: colors.textSecondary }]}>
                    Schedule a follow-up visit for this patient
                  </Text>
                </View>
                <Switch
                  value={scheduleFollowUp}
                  onValueChange={setScheduleFollowUp}
                  trackColor={{ false: colors.border, true: colors.teal }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {scheduleFollowUp && (
                <View style={{ marginTop: Spacing[3] }}>
                  <Text style={[sheetStyles.sublabel, { color: colors.textSecondary }]}>
                    FOLLOW-UP DATE
                  </Text>
                  <DateStrip
                    selectedDate={followUpDate}
                    onSelect={setFollowUpDate}
                    colors={colors}
                  />
                  <View style={{ marginTop: Spacing[3] }}>
                    <Text style={[sheetStyles.sublabel, { color: colors.textSecondary }]}>
                      NOTES FOR PATIENT (optional)
                    </Text>
                    <View
                      style={[
                        sheetStyles.noteInput,
                        {
                          backgroundColor: colors.bg,
                          borderColor: notesFocused ? colors.teal : colors.border,
                          borderWidth: notesFocused ? 1.5 : 1,
                        },
                      ]}
                    >
                      <TextInput
                        style={[
                          sheetStyles.noteInputText,
                          { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular },
                        ]}
                        placeholder="e.g. Please bring your latest blood test report"
                        placeholderTextColor={colors.textSecondary}
                        value={followUpNotes}
                        onChangeText={setFollowUpNotes}
                        onFocus={() => setNotesFocused(true)}
                        onBlur={() => setNotesFocused(false)}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Prescription shortcut */}
            <TouchableOpacity
              style={[sheetStyles.rxRow, { borderColor: colors.teal, backgroundColor: colors.tealLight }]}
              onPress={() => {
                handleClose();
                navigation?.navigate('ClinicalTab', {
                  screen: 'CreatePrescription',
                  params: {
                    appointmentId: appointment?.id,
                    patientId: appointment?.patient_id,
                  },
                });
              }}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.teal} />
              <Text style={[sheetStyles.rxText, { color: colors.teal }]}>
                Write a prescription for this visit
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.teal} />
            </TouchableOpacity>

            <View style={[sheetStyles.divider, { backgroundColor: colors.border }]} />

            {/* Buttons */}
            <View style={sheetStyles.btnRow}>
              <TouchableOpacity
                style={[sheetStyles.btnCancel, { borderColor: colors.border }]}
                onPress={handleClose}
                disabled={completeMutation.isPending}
              >
                <Text style={[sheetStyles.btnCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sheetStyles.btnComplete,
                  { backgroundColor: completeMutation.isPending ? colors.textSecondary : '#12B76A' },
                ]}
                onPress={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                activeOpacity={0.88}
              >
                {completeMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={sheetStyles.btnCompleteText}>Complete Appointment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: Spacing[8] }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
  },
  title: {
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: 18,
    marginBottom: 3,
  },
  subtitle: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing[3],
  },
  section: {
    marginBottom: Spacing[4],
  },
  label: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
    marginBottom: Spacing[2],
  },
  sublabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
    marginBottom: Spacing[2],
  },
  textarea: {
    borderRadius: Radius.md,
    padding: Spacing[3],
    minHeight: 100,
  },
  textareaInput: {
    fontSize: FontSize.base,
    lineHeight: 22,
    minHeight: 80,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  toggleDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  noteInput: {
    height: 48,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    justifyContent: 'center',
  },
  noteInputText: {
    fontSize: FontSize.base,
  },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  rxText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  btnCancel: {
    flex: 1,
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.base,
  },
  btnComplete: {
    flex: 2,
    height: 50,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnCompleteText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
    color: '#FFFFFF',
  },
});