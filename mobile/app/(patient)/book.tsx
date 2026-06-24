/**
 * Book Appointment — 3-step flow
 * Date → Time → Confirm
 * Doctor always visible as a sticky context card below the header.
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { bookAppointment, getDoctorSlots, joinWaitlist } from '@/api/appointments';
import { getDoctor } from '@/api/doctors';
import { formatDoctorName } from '@/api/types';
import { DateStrip, buildDateItems } from '@/components/lumina/DateStrip';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SlotGrid } from '@/components/lumina/SlotGrid';
import {
  LuminaFontFamily,
  LuminaRadius,
  LuminaShadow,
  LuminaSpacing,
} from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

// 3 steps: 0=Date, 1=Time, 2=Confirm
const STEPS = [
  { label: 'Date', icon: 'calendar-outline' as const },
  { label: 'Time', icon: 'time-outline' as const },
  { label: 'Confirm', icon: 'checkmark-circle-outline' as const },
];

const DATES = buildDateItems(14);

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
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

export default function BookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(DATES[0].full);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reasonFocused, setReasonFocused] = useState(false);

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideIn = (forward = true) => {
    slideAnim.setValue(forward ? 40 : -40);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const goForward = () => {
    triggerHaptic('light');
    slideIn(true);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    triggerHaptic('light');
    slideIn(false);
    setStep((s) => s - 1);
  };

  // Queries
  const { data: doctor, isLoading: loadingDoctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => getDoctor(parseInt(doctorId!, 10)),
    enabled: !!doctorId,
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', doctorId, selectedDate],
    queryFn: () => getDoctorSlots(parseInt(doctorId!, 10), selectedDate),
    enabled: !!doctorId && step >= 1,
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      bookAppointment({
        doctor_id: parseInt(doctorId!, 10),
        appointment_date: selectedDate,
        start_time: selectedSlot!,
        reason: reason || 'Routine Consultation',
      }),
    onSuccess: (appt) =>
      router.replace({
        pathname: '/(patient)/book/success',
        params: {
          appointmentId: String(appt.id),
          doctorName: doctorName,
          date: selectedDate,
          time: selectedSlot ?? '',
        },
      }),
  });

  const waitlistMutation = useMutation({
    mutationFn: () =>
      joinWaitlist({ doctor_id: parseInt(doctorId!, 10), desired_date: selectedDate, reason }),
    onSuccess: () => router.replace('/(patient)/appointments'),
  });

  const slots = slotsData?.slots?.filter((s) => s.start_time) ?? [];
  const doctorName = formatDoctorName(doctor?.user?.full_name ?? doctor?.full_name ?? '');
  const specialty = doctor?.specialization;
  const fee = doctor?.consultation_fee;
  const initials = doctorName
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  const canContinue =
    step === 0
      ? !!selectedDate
      : step === 1
        ? !!selectedSlot || slots.length === 0
        : true;

  const isLastStep = step === STEPS.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ScreenHeader title="Book Appointment" role="patient" />

      {/* Sticky doctor context card */}
      {loadingDoctor ? (
        <View style={{ paddingHorizontal: LuminaSpacing.xl, marginBottom: LuminaSpacing.md }}>
          <LoadingSkeleton count={1} />
        </View>
      ) : doctor ? (
        <View style={[styles.doctorCtx, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
          <View style={[styles.doctorCtxAvatar, { backgroundColor: colors.coralSoft }]}>
            <Text style={[styles.doctorCtxInitials, { color: colors.coral }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.doctorCtxName, { color: colors.text }]} numberOfLines={1}>
              {doctorName}
            </Text>
            <View style={styles.doctorCtxMeta}>
              {specialty ? (
                <View style={[styles.specPill, { backgroundColor: colors.tealSoft }]}>
                  <Text style={[styles.specPillText, { color: colors.teal }]}>{specialty}</Text>
                </View>
              ) : null}
              {fee != null ? (
                <View style={[styles.feePill, { backgroundColor: colors.coralSoft }]}>
                  <Text style={[styles.feePillText, { color: colors.coral }]}>₹{fee}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* Step indicator */}
      <View style={styles.stepper}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={s.label}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: done ? colors.coral : active ? colors.coralSoft : colors.neutral100,
                      borderWidth: active ? 2 : 0,
                      borderColor: active ? colors.coral : 'transparent',
                    },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNum, { color: active ? colors.coral : colors.textMuted }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, { color: active ? colors.coral : colors.textMuted }]}>
                  {s.label}
                </Text>
              </View>
              {i < STEPS.length - 1 ? (
                <View style={[styles.stepLine, { backgroundColor: done ? colors.coral : colors.border }]} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      {/* Step content */}
      <Animated.View
        style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step 0 — Date */}
          {step === 0 ? (
            <View>
              <Text style={[styles.stepHeading, { color: colors.coral }]}>SELECT DATE</Text>
              <DateStrip
                dates={DATES}
                selected={selectedDate}
                onSelect={(d) => { triggerHaptic('light'); setSelectedDate(d); setSelectedSlot(null); }}
                role="patient"
              />
              <View style={[styles.selectedDateCard, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}>
                <Ionicons name="calendar" size={16} color={colors.coral} />
                <Text style={[styles.selectedDateText, { color: colors.coral }]}>
                  {formatDisplayDate(selectedDate)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Step 1 — Time */}
          {step === 1 ? (
            loadingSlots ? (
              <LoadingSkeleton count={3} />
            ) : (
              <View>
                <Text style={[styles.stepHeading, { color: colors.coral }]}>SELECT TIME</Text>
                <View style={[styles.dateSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.dateSummaryText, { color: colors.textSecondary }]}>
                    {formatDisplayDate(selectedDate)}
                  </Text>
                </View>
                {slots.length === 0 ? (
                  <View style={styles.noSlots}>
                    <View style={[styles.noSlotsIcon, { backgroundColor: colors.coralSoft }]}>
                      <Ionicons name="calendar-outline" size={32} color={colors.coral} />
                    </View>
                    <Text style={[styles.noSlotsTitle, { color: colors.text }]}>No slots available</Text>
                    <Text style={[styles.noSlotsBody, { color: colors.textSecondary }]}>
                      No appointments on this date. You can join the waitlist and we'll notify you.
                    </Text>
                    <LuminaButton
                      label="Join Waitlist"
                      variant="secondary"
                      role="patient"
                      onPress={() => waitlistMutation.mutate()}
                      loading={waitlistMutation.isPending}
                    />
                  </View>
                ) : (
                  <SlotGrid
                    slots={slots}
                    selected={selectedSlot}
                    onSelect={(t) => { triggerHaptic('light'); setSelectedSlot(t); }}
                    role="patient"
                  />
                )}
              </View>
            )
          ) : null}

          {/* Step 2 — Confirm */}
          {step === 2 ? (
            <View style={{ gap: LuminaSpacing.md }}>
              <Text style={[styles.stepHeading, { color: colors.coral }]}>REVIEW & CONFIRM</Text>

              {/* Summary card */}
              <View style={[styles.summaryCard, LuminaShadow.md, { backgroundColor: colors.surface }]}>
                <View style={[styles.summaryAccent, { backgroundColor: colors.coral }]} />
                <View style={{ flex: 1, gap: 12 }}>
                  <SummaryRow icon="person-outline" label="Doctor" value={doctorName} colors={colors} />
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <SummaryRow icon="calendar-outline" label="Date" value={formatDisplayDate(selectedDate)} colors={colors} />
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <SummaryRow icon="time-outline" label="Time" value={formatDisplayTime(selectedSlot ?? '')} colors={colors} mono />
                  {fee != null ? (
                    <>
                      <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                      <SummaryRow icon="card-outline" label="Fee" value={`₹${fee}`} colors={colors} accent />
                    </>
                  ) : null}
                </View>
              </View>

              {/* Reason input */}
              <View style={[
                styles.reasonBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: reasonFocused ? colors.coral : colors.border,
                  borderWidth: reasonFocused ? 1.5 : 1,
                },
                LuminaShadow.sm,
              ]}>
                <Text style={[styles.reasonLabel, { color: reasonFocused ? colors.coral : colors.textSecondary }]}>
                  Reason for visit (optional)
                </Text>
                <TextInput
                  style={[styles.reasonInput, { color: colors.text }]}
                  placeholder="e.g. Routine consultation, follow-up, test results..."
                  placeholderTextColor={colors.textMuted}
                  value={reason}
                  onChangeText={setReason}
                  onFocus={() => setReasonFocused(true)}
                  onBlur={() => setReasonFocused(false)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* DPDPA note */}
              <View style={[styles.dpBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.teal} />
                <Text style={[styles.dpText, { color: colors.teal }]}>
                  Your data is protected under DPDPA 2023 and shared only with your doctor.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background },
          LuminaShadow.nav,
        ]}
      >
        {step > 0 ? (
          <Pressable
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={goBack}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
            <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Back</Text>
          </Pressable>
        ) : null}

        {!isLastStep ? (
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: canContinue ? colors.coral : colors.border },
              canContinue && styles.primaryBtnShadow,
            ]}
            onPress={canContinue ? goForward : undefined}
            disabled={!canContinue}
          >
            <Text style={[styles.primaryBtnText, { color: canContinue ? '#FFFFFF' : colors.textMuted }]}>
              Continue
            </Text>
            <Ionicons name="arrow-forward" size={18} color={canContinue ? '#FFFFFF' : colors.textMuted} />
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: selectedSlot ? colors.coral : colors.border },
              selectedSlot && styles.primaryBtnShadow,
            ]}
            onPress={selectedSlot ? () => bookMutation.mutate() : undefined}
            disabled={!selectedSlot || bookMutation.isPending}
          >
            {bookMutation.isPending ? (
              <Text style={styles.primaryBtnText}>Booking...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={selectedSlot ? '#FFFFFF' : colors.textMuted} />
                <Text style={[styles.primaryBtnText, { color: selectedSlot ? '#FFFFFF' : colors.textMuted }]}>
                  Confirm Booking
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  colors,
  mono,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={summaryStyles.row}>
      <View style={[summaryStyles.iconWrap, { backgroundColor: colors.neutral100 }]}>
        <Ionicons name={icon} size={14} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[summaryStyles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
        <Text style={[
          summaryStyles.value,
          {
            color: accent ? colors.coral : colors.text,
            fontFamily: mono ? LuminaFontFamily.dmMonoMedium : LuminaFontFamily.dmSansMedium,
          },
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 30, height: 30, borderRadius: LuminaRadius.sm, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 10, letterSpacing: 0.6 },
  value: { fontSize: 15, marginTop: 1 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Doctor context strip
  doctorCtx: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.md,
    padding: 12,
    borderRadius: LuminaRadius.lg,
  },
  doctorCtxAvatar: {
    width: 44,
    height: 44,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  doctorCtxInitials: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 17 },
  doctorCtxName: { fontFamily: LuminaFontFamily.nunitoSemiBold, fontSize: 16 },
  doctorCtxMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  specPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: LuminaRadius.full },
  specPillText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
  feePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: LuminaRadius.full },
  feePillText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },

  // Step indicator
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.lg,
  },
  stepItem: { alignItems: 'center', gap: 5 },
  stepLine: { flex: 1, height: 2, marginBottom: 20 },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: 12, fontFamily: LuminaFontFamily.dmSansSemiBold },
  stepLabel: { fontSize: 10, fontFamily: LuminaFontFamily.dmSansRegular },

  // Content area
  stepContent: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.sm },

  // Section heading
  stepHeading: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: LuminaSpacing.md,
  },

  // Date selected banner
  selectedDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: LuminaSpacing.md,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  selectedDateText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 14,
  },

  // Date summary (in time step)
  dateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: LuminaSpacing.lg,
    padding: 10,
    borderRadius: LuminaRadius.md,
    borderWidth: 1,
  },
  dateSummaryText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },

  // No slots
  noSlots: { alignItems: 'center', gap: 14, paddingVertical: 40 },
  noSlotsIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  noSlotsTitle: { fontFamily: LuminaFontFamily.nunitoSemiBold, fontSize: 18 },
  noSlotsBody: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  // Summary card
  summaryCard: {
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 14,
  },
  summaryAccent: { width: 4, borderRadius: 2 },
  summaryDivider: { height: 1 },

  // Reason input
  reasonBox: {
    borderRadius: LuminaRadius.lg,
    padding: 14,
  },
  reasonLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 12,
    marginBottom: 8,
  },
  reasonInput: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    minHeight: 70,
    lineHeight: 20,
  },

  // DPDPA banner
  dpBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: LuminaRadius.md,
    borderWidth: 1,
  },
  dpText: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: LuminaSpacing.sm,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: LuminaSpacing.lg,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  backBtnText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
  },
  primaryBtnShadow: {
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
  },
});
