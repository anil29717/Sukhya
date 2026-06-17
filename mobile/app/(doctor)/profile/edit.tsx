import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMyDoctorProfile, updateMyDoctorProfile } from '@/api/doctor';
import { client } from '@/api/client';
import { UserResponse, normalizeUser } from '@/api/types';
import { setAuth } from '@/store/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function EditDoctorProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { user, token } = useSelector((s: RootState) => s.auth);

  const { data: doctor, isLoading } = useQuery({ queryKey: ['doctor-me'], queryFn: getMyDoctorProfile });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (doctor) {
      setFullName(doctor.user.full_name);
      setPhone(doctor.user.phone ?? '');
      setSpecialization(doctor.specialization ?? '');
      setQualification(doctor.qualification ?? '');
      setExperience(doctor.experience_years != null ? String(doctor.experience_years) : '');
      setFee(doctor.consultation_fee != null ? String(doctor.consultation_fee) : '');
      setBio(doctor.bio ?? '');
    }
  }, [doctor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await client.put<UserResponse>('/users/me', { full_name: fullName, phone: phone || null });
      await updateMyDoctorProfile({
        specialization: specialization || undefined,
        qualification: qualification || undefined,
        experience_years: experience ? parseInt(experience, 10) : undefined,
        consultation_fee: fee ? parseFloat(fee) : undefined,
        bio: bio || undefined,
      });
    },
    onSuccess: async () => {
      const userRes = await client.get<UserResponse>('/users/me');
      if (token) dispatch(setAuth({ user: normalizeUser(userRes.data), token }));
      queryClient.invalidateQueries({ queryKey: ['doctor-me'] });
      Alert.alert('Saved', 'Profile updated.');
      router.back();
    },
  });

  if (isLoading) return <><ScreenHeader title="Edit Profile" /><LoadingState /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Edit Profile" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <LuminaInput label="Full name" value={fullName} onChangeText={setFullName} />
          <LuminaInput label="Phone" value={phone} onChangeText={setPhone} />
          <LuminaInput label="Email" value={user?.email ?? ''} editable={false} />
          <LuminaInput label="Specialization" value={specialization} onChangeText={setSpecialization} />
          <LuminaInput label="Qualification" value={qualification} onChangeText={setQualification} />
          <LuminaInput label="Experience (years)" value={experience} onChangeText={setExperience} keyboardType="numeric" />
          <LuminaInput label="Consultation fee" value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
          <LuminaInput label="Bio" value={bio} onChangeText={setBio} multiline />
        </LuminaCard>
        <LuminaButton label="Save Changes" onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.md },
});
