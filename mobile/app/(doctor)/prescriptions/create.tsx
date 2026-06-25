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
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createPrescription, sharePrescription } from '@/api/prescriptions';
import { getPatient } from '@/api/patients';
import { calcAge } from '@/api/types';
import { LuminaInput } from '@/components/lumina/LuminaButton';
import { ContextStrip } from '@/components/lumina/ContextStrip';
import { MedicineRow } from '@/components/lumina/MedicineRow';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SectionLabel } from '@/components/lumina/SectionLabel';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

type Medicine = { name: string; dosage: string; frequency: string; duration: string };

const EMPTY_MED: Medicine = { name: '', dosage: '', frequency: '', duration: '' };

export default function CreatePrescriptionScreen() {
  const { patientId, appointmentId } = useLocalSearchParams<{ patientId: string; appointmentId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'doctor' });

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([{ ...EMPTY_MED }]);
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatient(parseInt(patientId!, 10)),
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: async (share: boolean) => {
      const rx = await createPrescription({
        patient_id: parseInt(patientId!, 10),
        appointment_id: appointmentId ? parseInt(appointmentId, 10) : undefined,
        diagnosis: diagnosis || undefined,
        medications: medicines.filter((m) => m.name.trim()).map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration })),
        instructions: instructions || notes || undefined,
      });
      if (share) return sharePrescription(rx.id);
      return rx;
    },
    onSuccess: () => {
      router.replace({ pathname: '/(doctor)/success', params: { type: 'prescription_created' } });
    },
    onError: () => Alert.alert('Error', 'Could not create prescription. Check at least one medication name is filled.'),
  });

  const updateMed = (idx: number, field: keyof Medicine, value: string) => {
    setMedicines((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMed = () => setMedicines((prev) => [...prev, { ...EMPTY_MED }]);
  const removeMed = (idx: number) => setMedicines((prev) => prev.filter((_, i) => i !== idx));

  const age = patient ? calcAge(patient.date_of_birth) : undefined;
  const isValid = medicines.some((m) => m.name.trim().length > 0);
  const isPending = createMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Create Prescription" role="doctor" />
      {patient ? (
        <ContextStrip
          name={patient.user.full_name}
          age={age ?? undefined}
          gender={patient.gender ?? undefined}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionLabel title="Diagnosis" />
        <View style={[styles.fieldCard, { backgroundColor: colors.surface, borderColor: colors.border }, LuminaShadow.xs]}>
          <LuminaInput
            label="Diagnosis"
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="Enter diagnosis"
          />
          <LuminaInput
            label="Instructions"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            placeholder="Dosing instructions, precautions..."
          />
          <LuminaInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Internal notes for this prescription"
          />
        </View>

        <SectionLabel
          title={`Medicines (${medicines.length})`}
          actionLabel="+ Add"
          onAction={addMed}
        />
        {medicines.map((med, idx) => (
          <View key={idx}>
            <MedicineRow
              index={idx}
              medicine={{ name: med.name || 'New medicine', dosage: med.dosage, frequency: med.frequency, duration: med.duration }}
              onRemove={medicines.length > 1 ? () => removeMed(idx) : undefined}
            />
            <View style={[styles.medFields, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LuminaInput label="Medicine name *" value={med.name} onChangeText={(v) => updateMed(idx, 'name', v)} />
              <LuminaInput label="Dosage" value={med.dosage} onChangeText={(v) => updateMed(idx, 'dosage', v)} placeholder="e.g. 500mg" />
              <LuminaInput label="Frequency" value={med.frequency} onChangeText={(v) => updateMed(idx, 'frequency', v)} placeholder="e.g. Twice daily" />
              <LuminaInput label="Duration" value={med.duration} onChangeText={(v) => updateMed(idx, 'duration', v)} placeholder="e.g. 7 days" />
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.btnRow}>
          <Pressable
            style={[
              styles.btnDraft,
              { borderColor: isValid ? colors.teal : colors.border },
              !isValid && { opacity: 0.6 },
            ]}
            disabled={!isValid || isPending}
            onPress={() => { triggerHaptic('light'); createMutation.mutate(false); }}
          >
            {isPending ? (
              <ActivityIndicator color={colors.teal} size="small" />
            ) : (
              <Text style={[styles.btnDraftText, { color: isValid ? colors.teal : colors.textMuted }]}>
                Save as Draft
              </Text>
            )}
          </Pressable>
          <Pressable
            style={[
              styles.btnShare,
              { backgroundColor: isValid ? colors.coral : colors.border },
              !isValid && { opacity: 0.6 },
            ]}
            disabled={!isValid || isPending}
            onPress={() => { triggerHaptic('light'); createMutation.mutate(true); }}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnShareText} numberOfLines={1}>
                Save & Share
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.md, gap: LuminaSpacing.sm },
  fieldCard: {
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    padding: LuminaSpacing.lg,
    gap: LuminaSpacing.sm,
    marginBottom: LuminaSpacing.sm,
  },
  medFields: {
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    padding: LuminaSpacing.lg,
    gap: LuminaSpacing.sm,
    marginBottom: LuminaSpacing.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btnRow: {
    flexDirection: 'row',
    gap: LuminaSpacing.md,
  },
  btnDraft: {
    flex: 1,
    height: 52,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.sm,
  },
  btnDraftText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 14,
    textAlign: 'center',
  },
  btnShare: {
    flex: 1.4,
    height: 52,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.sm,
  },
  btnShareText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
