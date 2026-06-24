import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { getDoctor } from '@/api/doctors';
import { formatDoctorName } from '@/api/types';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const insets = useSafeAreaInsets();

  const { data: doctor, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctor(parseInt(id!, 10)),
    enabled: !!id,
  });

  if (isLoading) return <><ScreenHeader title="Doctor Profile" role="patient" /><LoadingSkeleton count={3} /></>;
  if (error || !doctor) return <><ScreenHeader title="Doctor Profile" role="patient" /><ErrorState onRetry={refetch} /></>;

  const name = formatDoctorName(doctor.user?.full_name ?? doctor.full_name);
  const initials = name.replace(/^Dr\.?\s*/i, '').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="" showBack role="patient" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}>
        {/* Hero card */}
        <View style={[styles.hero, LuminaShadow.md, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.coralSoft }]}>
            <Text style={[styles.initials, { color: colors.coral }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          {doctor.specialization ? (
            <View style={[styles.specChip, { backgroundColor: colors.tealSoft }]}>
              <Text style={[styles.specText, { color: colors.teal }]}>{doctor.specialization}</Text>
            </View>
          ) : null}
          {doctor.clinic_name ? (
            <Text style={[styles.clinic, { color: colors.textSecondary }]}>{doctor.clinic_name}</Text>
          ) : null}
        </View>

        <InfoSection title="Qualification" value={doctor.qualification ?? 'Not specified'} colors={colors} />
        <InfoSection title="Experience" value={`${doctor.experience_years ?? 0} years`} colors={colors} />
        <InfoSection title="Consultation Fee" value={`₹${doctor.consultation_fee ?? '—'}`} colors={colors} mono />
        {doctor.bio ? <InfoSection title="About" value={doctor.bio} colors={colors} /> : null}
        {doctor.clinic_address ? <InfoSection title="Location" value={doctor.clinic_address} colors={colors} /> : null}
      </ScrollView>

      {/* Sticky book bar */}
      <View style={[styles.bookBar, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) }, LuminaShadow.nav]}>
        <LuminaButton
          label="Book Appointment"
          icon="calendar-outline"
          role="patient"
          onPress={() => router.push({ pathname: '/(patient)/book', params: { doctorId: id } })}
        />
      </View>
    </View>
  );
}

function InfoSection({ title, value, colors, mono }: {
  title: string;
  value: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  mono?: boolean;
}) {
  return (
    <View style={[styles.infoCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
      <Text style={[styles.infoTitle, { color: colors.textMuted }]}>{title}</Text>
      <Text style={[styles.infoValue, { color: colors.text, fontFamily: mono ? LuminaFontFamily.dmMonoRegular : LuminaFontFamily.dmSansRegular }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.md, gap: LuminaSpacing.md },
  hero: {
    alignItems: 'center',
    padding: LuminaSpacing.xl,
    borderRadius: LuminaRadius.xl,
    gap: LuminaSpacing.sm,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: LuminaSpacing.sm },
  initials: { fontSize: 32, fontFamily: LuminaFontFamily.nunitoExtraBold },
  name: { ...LuminaTypography.h2, fontFamily: LuminaFontFamily.nunitoBold, textAlign: 'center' },
  specChip: { paddingHorizontal: LuminaSpacing.md, paddingVertical: 5, borderRadius: LuminaRadius.full },
  specText: { fontSize: 13, fontFamily: LuminaFontFamily.dmSansMedium },
  clinic: { ...LuminaTypography.bodySmall },
  infoCard: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg },
  infoTitle: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansMedium, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { ...LuminaTypography.body },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
  },
});
