import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { getDoctor } from '@/api/doctors';
import { formatDoctorName } from '@/api/types';
import { LoadingState, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useLuminaTheme();

  const { data: doctor, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctor(parseInt(id!, 10)),
    enabled: !!id,
  });

  if (isLoading) return <><ScreenHeader title="Doctor Profile" /><LoadingState /></>;
  if (error || !doctor) return <><ScreenHeader title="Doctor Profile" /><ErrorState onRetry={refetch} /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Doctor Profile" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accentBlue }]}>
            <Ionicons name="person" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{formatDoctorName(doctor.user?.full_name ?? doctor.full_name)}</Text>
          <Text style={[styles.spec, { color: colors.accentTeal }]}>{doctor.specialization}</Text>
          {doctor.clinic_name ? <Text style={[styles.clinic, { color: colors.textSecondary }]}>{doctor.clinic_name}</Text> : null}
        </View>

        <InfoSection title="Qualification" value={doctor.qualification ?? 'Not specified'} colors={colors} />
        <InfoSection title="Experience" value={`${doctor.experience_years ?? 0} years`} colors={colors} />
        <InfoSection title="Consultation Fee" value={`$${doctor.consultation_fee ?? '—'}`} colors={colors} />
        {doctor.bio ? <InfoSection title="About" value={doctor.bio} colors={colors} /> : null}
        {doctor.clinic_address ? <InfoSection title="Location" value={doctor.clinic_address} colors={colors} /> : null}

        <LuminaButton label="Book Appointment" icon="calendar-outline" onPress={() => router.push({ pathname: '/(patient)/book', params: { doctorId: id } })} />
      </ScrollView>
    </View>
  );
}

function InfoSection({ title, value, colors }: { title: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.infoTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.md },
  hero: { alignItems: 'center', padding: LuminaSpacing.xl, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: LuminaSpacing.md },
  name: { ...LuminaTypography.h2 },
  spec: { ...LuminaTypography.body, fontWeight: '600', marginTop: 4 },
  clinic: { ...LuminaTypography.bodySmall, marginTop: 4 },
  infoCard: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  infoTitle: { ...LuminaTypography.caption, marginBottom: LuminaSpacing.xs },
  infoValue: { ...LuminaTypography.body },
});
