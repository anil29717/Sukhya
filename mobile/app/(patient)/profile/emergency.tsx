import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMyPatientProfile, updateMyProfile } from '@/api/patients';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();

  const { data: patient, isLoading } = useQuery({ queryKey: ['patient-me'], queryFn: getMyPatientProfile });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  useEffect(() => {
    if (patient) {
      setName(patient.emergency_contact_name ?? '');
      setPhone(patient.emergency_contact_phone ?? '');
    }
  }, [patient]);

  const mutation = useMutation({
    mutationFn: () => updateMyProfile({ emergency_contact_name: name, emergency_contact_phone: phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-me'] });
      router.back();
    },
  });

  if (isLoading) return <><ScreenHeader title="Emergency Contacts" /><LoadingState /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Emergency Contacts" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Your primary emergency contact is stored on your patient profile. Family members have separate emergency profiles in Family Management.
        </Text>
        <LuminaInput label="Contact Name" value={name} onChangeText={setName} icon="person-outline" />
        <LuminaInput label="Contact Phone" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
        <LuminaButton label="Save Contact" onPress={() => mutation.mutate()} loading={mutation.isPending} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg },
  note: { ...LuminaTypography.bodySmall, marginBottom: LuminaSpacing.lg },
});
