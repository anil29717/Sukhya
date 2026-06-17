import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createVital } from '@/api/medications';
import { LuminaButton, LuminaChip, LuminaInput } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const VITAL_TYPES = [
  { key: 'blood_pressure', label: 'Blood Pressure', placeholder: '120/80', unit: 'mmHg' },
  { key: 'blood_sugar', label: 'Blood Sugar', placeholder: '100', unit: 'mg/dL' },
  { key: 'weight', label: 'Weight', placeholder: '70', unit: 'kg' },
  { key: 'heart_rate', label: 'Heart Rate', placeholder: '72', unit: 'bpm' },
  { key: 'oxygen', label: 'Oxygen', placeholder: '98', unit: '%' },
];

export default function AddVitalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { activePatientId } = useActivePatient();

  const [vitalType, setVitalType] = useState('blood_pressure');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const selected = VITAL_TYPES.find((v) => v.key === vitalType)!;

  const mutation = useMutation({
    mutationFn: () =>
      createVital({
        vital_type: vitalType,
        value,
        unit: selected.unit,
        notes: notes || undefined,
        patient_id: activePatientId ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitals'] });
      router.back();
    },
    onError: () => Alert.alert('Error', 'Could not save vital reading.'),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Add Vital Reading" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.chips}>{VITAL_TYPES.map((v) => <LuminaChip key={v.key} label={v.label} active={vitalType === v.key} onPress={() => setVitalType(v.key)} />)}</View>
        <LuminaInput label={`Value (${selected.unit})`} value={value} onChangeText={setValue} placeholder={selected.placeholder} keyboardType="decimal-pad" />
        <LuminaInput label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="How are you feeling?" />
        <LuminaButton label="Save Reading" onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!value} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.lg },
});
