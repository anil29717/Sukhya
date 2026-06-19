import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMyPatientProfile, updateMedicalInfo } from '@/api/patients';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function MedicalInfoScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();

  const { data: patient, isLoading } = useQuery({ queryKey: ['patient-me'], queryFn: getMyPatientProfile });
  const [allergies, setAllergies] = useState('');
  const [history, setHistory] = useState('');
  const [conditions, setConditions] = useState('');
  useEffect(() => {
    if (patient) {
      setAllergies(patient.allergies ?? '');
      setHistory(patient.medical_history ?? '');
      setConditions(patient.existing_conditions ?? '');
    }
  }, [patient]);

  const mutation = useMutation({
    mutationFn: () => updateMedicalInfo({ allergies, medical_history: history, existing_conditions: conditions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-me'] });
      router.back();
    },
  });

  if (isLoading) return <><ScreenHeader title="Medical Information" /><LoadingState /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Medical Information" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaInput label="Allergies" value={allergies} onChangeText={setAllergies} placeholder="Penicillin, peanuts..." multiline />
        <LuminaInput label="Medical History" value={history} onChangeText={setHistory} placeholder="Past surgeries, conditions..." multiline />
        <LuminaInput label="Chronic Conditions" value={conditions} onChangeText={setConditions} placeholder="Diabetes, hypertension..." multiline />
        <LuminaButton label="Update Information" onPress={() => mutation.mutate()} loading={mutation.isPending} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg },
});
