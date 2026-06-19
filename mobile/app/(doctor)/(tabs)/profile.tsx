import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { getMyDoctorProfile } from '@/api/doctor';
import { RootState } from '@/store/store';
import { performLogout } from '@/utils/session';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const MENU = [
  { icon: 'create-outline' as const, label: 'Edit Profile', route: '/(doctor)/profile/edit' },
  { icon: 'school-outline' as const, label: 'Professional Details', route: '/(doctor)/profile/professional' },
  { icon: 'bar-chart-outline' as const, label: 'Performance Dashboard', route: '/(doctor)/profile/analytics' },
  { icon: 'notifications-outline' as const, label: 'Notifications', route: '/(doctor)/notifications' },
  { icon: 'arrow-redo-outline' as const, label: 'Follow-Ups', route: '/(doctor)/follow-ups' },
  { icon: 'settings-outline' as const, label: 'Settings', route: '/(doctor)/settings' },
];

export default function DoctorProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();
  const { user } = useSelector((s: RootState) => s.auth);

  const { data: doctor, isLoading } = useQuery({ queryKey: ['doctor-me'], queryFn: getMyDoctorProfile });

  const handleLogout = () => performLogout();

  if (isLoading) return <LoadingState label="Loading profile..." />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.lg }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accentTealLight }]}>
          <Text style={{ color: colors.accentTeal, fontSize: 28, fontWeight: '700' }}>
            {(user?.full_name ?? 'D').charAt(0)}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.full_name ?? 'Doctor'}</Text>
        <Text style={{ color: colors.textSecondary }}>{doctor?.specialization ?? 'Physician'}</Text>
        {doctor?.qualification ? <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{doctor.qualification}</Text> : null}
      </View>

      <LuminaCard style={styles.statsCard}>
        <View style={styles.statRow}>
          <StatItem label="Experience" value={doctor?.experience_years != null ? `${doctor.experience_years} yrs` : '—'} colors={colors} />
          <StatItem label="Fee" value={doctor?.consultation_fee != null ? `$${doctor.consultation_fee}` : '—'} colors={colors} />
        </View>
      </LuminaCard>

      <View style={styles.menu}>
        {MENU.map((item) => (
          <Pressable key={item.label} style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(item.route as never)}>
            <Ionicons name={item.icon} size={22} color={colors.accentTeal} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
        <Pressable style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.accentRed} />
          <Text style={[styles.menuLabel, { color: colors.accentRed }]}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 18 }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingHorizontal: LuminaSpacing.lg, paddingBottom: LuminaSpacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: LuminaSpacing.md },
  name: { ...LuminaTypography.h1, fontSize: 24 },
  statsCard: { marginHorizontal: LuminaSpacing.lg, marginBottom: LuminaSpacing.lg },
  statRow: { flexDirection: 'row' },
  menu: { paddingHorizontal: LuminaSpacing.lg, gap: LuminaSpacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md, padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
});
