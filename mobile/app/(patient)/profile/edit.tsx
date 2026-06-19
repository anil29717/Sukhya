import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMyPatientProfile, updateMyProfile } from '@/api/patients';
import { client } from '@/api/client';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();

  const { data: patient, isLoading } = useQuery({ queryKey: ['patient-me'], queryFn: getMyPatientProfile });
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  useEffect(() => {
    if (patient) {
      setFullName(patient.user.full_name);
      setPhone(patient.user.phone ?? '');
      setBloodGroup(patient.blood_group ?? '');
    }
  }, [patient]);

  const mutation = useMutation({
    mutationFn: async () => {
      await client.put('/users/me', { full_name: fullName, phone: phone || null });
      await updateMyProfile({ blood_group: bloodGroup || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-me'] });
      router.back();
    },
  });

  if (isLoading) return <><ScreenHeader title="Edit Profile" /><LoadingState /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Edit Profile" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaInput label="Full Name" value={fullName} onChangeText={setFullName} icon="person-outline" />
        <LuminaInput label="Phone" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
        <LuminaInput label="Blood Group" value={bloodGroup} onChangeText={setBloodGroup} placeholder="A+" />
        <LuminaButton label="Save Changes" onPress={() => mutation.mutate()} loading={mutation.isPending} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg },
});
