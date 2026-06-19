import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';

import { getDoctor } from '@/api/doctors';
import { formatDoctorName } from '@/api/types';
import { getDoctorSlots, bookAppointment, joinWaitlist } from '@/api/appointments';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const STEPS = ['Doctor', 'Date', 'Time', 'Confirm'];

export default function BookScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { full: d.toISOString().split('T')[0], day: d.toLocaleDateString('en-US', { weekday: 'short' }), num: d.getDate() };
  });

  const { data: doctor } = useQuery({ queryKey: ['doctor', doctorId], queryFn: () => getDoctor(parseInt(doctorId!, 10)), enabled: !!doctorId });
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', doctorId, selectedDate],
    queryFn: () => getDoctorSlots(parseInt(doctorId!, 10), selectedDate),
    enabled: !!doctorId && step >= 2,
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      bookAppointment({
        doctor_id: parseInt(doctorId!, 10),
        appointment_date: selectedDate,
        start_time: selectedSlot!,
        reason: reason || 'Routine Consultation',
      }),
    onSuccess: (appt) => router.replace({ pathname: '/(patient)/book/success', params: { appointmentId: String(appt.id) } }),
  });

  const waitlistMutation = useMutation({
    mutationFn: () => joinWaitlist({ doctor_id: parseInt(doctorId!, 10), desired_date: selectedDate, reason }),
    onSuccess: () => router.replace('/(patient)/appointments'),
  });

  const slots = slotsData?.slots?.filter((s) => s.start_time) ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Book Appointment" subtitle={`Step ${step + 1} of 4 — ${STEPS[step]}`} />
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.stepDot, { backgroundColor: i <= step ? colors.tabActive : colors.border }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 0 && doctor ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{formatDoctorName(doctor?.user?.full_name ?? doctor?.full_name)}</Text>
            <Text style={{ color: colors.textSecondary }}>{doctor.specialization}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Fee: ${doctor.consultation_fee ?? '—'}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((d) => (
              <Pressable key={d.full} style={[styles.dateChip, { borderColor: colors.border, backgroundColor: selectedDate === d.full ? colors.navy : colors.surface }]} onPress={() => setSelectedDate(d.full)}>
                <Text style={{ color: selectedDate === d.full ? colors.onPrimary : colors.textMuted, fontSize: 11 }}>{d.day}</Text>
                <Text style={{ color: selectedDate === d.full ? colors.onPrimary : colors.text, fontWeight: '700', fontSize: 18 }}>{d.num}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {step === 2 ? (
          loadingSlots ? (
            <LoadingState label="Loading slots..." />
          ) : slots.length === 0 ? (
            <View style={styles.emptySlots}>
              <Text style={{ color: colors.textSecondary }}>No slots available on this date.</Text>
              <LuminaButton label="Join Waitlist" variant="secondary" onPress={() => waitlistMutation.mutate()} loading={waitlistMutation.isPending} />
            </View>
          ) : (
            <View style={styles.slotGrid}>
              {slots.map((s) => (
                <Pressable key={s.start_time} style={[styles.slot, { borderColor: colors.border, backgroundColor: selectedSlot === s.start_time ? colors.navy : colors.surface }]} onPress={() => setSelectedSlot(s.start_time)}>
                  <Text style={{ color: selectedSlot === s.start_time ? colors.onPrimary : colors.text, fontWeight: '600' }}>{s.start_time.slice(0, 5)}</Text>
                </Pressable>
              ))}
            </View>
          )
        ) : null}

        {step === 3 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Confirm Booking</Text>
            <Text style={{ color: colors.textSecondary }}>Doctor: {formatDoctorName(doctor?.user?.full_name ?? doctor?.full_name)}</Text>
            <Text style={{ color: colors.textSecondary }}>Date: {selectedDate}</Text>
            <Text style={{ color: colors.textSecondary }}>Time: {selectedSlot?.slice(0, 5)}</Text>
            <LuminaInput label="Reason (optional)" value={reason} onChangeText={setReason} placeholder="Routine consultation" />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? <LuminaButton label="Back" variant="outline" onPress={() => setStep(step - 1)} /> : null}
        {step < 3 ? (
          <LuminaButton label="Continue" onPress={() => setStep(step + 1)} disabled={step === 2 && !selectedSlot && slots.length > 0} />
        ) : (
          <LuminaButton label="Confirm Booking" onPress={() => bookMutation.mutate()} loading={bookMutation.isPending} disabled={!selectedSlot} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  steps: { flexDirection: 'row', gap: 8, paddingHorizontal: LuminaSpacing.lg, marginBottom: LuminaSpacing.md },
  stepDot: { flex: 1, height: 4, borderRadius: 2 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 100 },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  cardTitle: { ...LuminaTypography.h3, marginBottom: LuminaSpacing.sm },
  dateRow: { gap: LuminaSpacing.sm },
  dateChip: { width: 56, height: 72, borderRadius: LuminaRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: LuminaSpacing.sm },
  slot: { paddingHorizontal: LuminaSpacing.lg, paddingVertical: LuminaSpacing.md, borderRadius: LuminaRadius.md, borderWidth: 1 },
  emptySlots: { gap: LuminaSpacing.lg, alignItems: 'center', paddingVertical: 40 },
  footer: { flexDirection: 'row', gap: LuminaSpacing.sm, padding: LuminaSpacing.lg, paddingBottom: 32 },
});
