import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { createPrescription, sharePrescription } from '@/api/prescriptions';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function CreatePrescriptionScreen() {
  const { patientId, appointmentId } = useLocalSearchParams<{ patientId: string; appointmentId?: string }>();
  const router = useRouter();
  const { colors } = useLuminaTheme();

  const [diagnosis, setDiagnosis] = useState('');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: async (share: boolean) => {
      const rx = await createPrescription({
        patient_id: parseInt(patientId!, 10),
        appointment_id: appointmentId ? parseInt(appointmentId, 10) : undefined,
        diagnosis: diagnosis || undefined,
        medications: [{ name: medName, dosage, frequency, duration }],
        instructions: instructions || notes || undefined,
      });
      if (share) return sharePrescription(rx.id);
      return rx;
    },
    onSuccess: () => {
      router.replace({ pathname: '/(doctor)/success', params: { type: 'prescription_created' } });
    },
    onError: () => Alert.alert('Error', 'Could not create prescription. Check medication name is filled.'),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Create Prescription" subtitle={`Patient #${patientId}`} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <LuminaInput label="Diagnosis" value={diagnosis} onChangeText={setDiagnosis} />
          <LuminaInput label="Medication name *" value={medName} onChangeText={setMedName} />
          <LuminaInput label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />
          <LuminaInput label="Frequency" value={frequency} onChangeText={setFrequency} placeholder="e.g. Twice daily" />
          <LuminaInput label="Duration" value={duration} onChangeText={setDuration} placeholder="e.g. 7 days" />
          <LuminaInput label="Instructions" value={instructions} onChangeText={setInstructions} multiline />
          <LuminaInput label="Notes" value={notes} onChangeText={setNotes} multiline />
        </LuminaCard>
        <LuminaButton label="Save as Draft" variant="secondary" onPress={() => createMutation.mutate(false)} loading={createMutation.isPending} />
        <LuminaButton label="Save & Share with Patient" onPress={() => createMutation.mutate(true)} loading={createMutation.isPending} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.md, paddingBottom: 40 },
});
