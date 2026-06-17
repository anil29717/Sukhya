import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMyPatientProfile } from '@/api/patients';
import { RootState } from '@/store/store';
import { clearAuth } from '@/store/authSlice';
import { tokenStorage, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/storage';
import { logout } from '@/api/auth';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const MENU_ITEMS = [
  { icon: 'person-outline' as const, label: 'Edit Profile', route: '/(patient)/profile/edit' },
  { icon: 'medical-outline' as const, label: 'Medical Information', route: '/(patient)/profile/medical' },
  { icon: 'call-outline' as const, label: 'Emergency Contacts', route: '/(patient)/profile/emergency' },
  { icon: 'people-outline' as const, label: 'Family Members', route: '/(patient)/family' },
  { icon: 'calendar-outline' as const, label: 'Appointments', route: '/(patient)/appointments' },
  { icon: 'medkit-outline' as const, label: 'Medications', route: '/(patient)/medications' },
  { icon: 'settings-outline' as const, label: 'Settings', route: '/(patient)/settings' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { colors } = useLuminaTheme();
  const { user } = useSelector((s: RootState) => s.auth);

  const { data: patient } = useQuery({
    queryKey: ['patient-me'],
    queryFn: getMyPatientProfile,
    enabled: !!user,
  });

  const handleLogout = async () => {
    const refresh = await tokenStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) await logout(refresh);
    await tokenStorage.removeItem(ACCESS_TOKEN_KEY);
    await tokenStorage.removeItem(REFRESH_TOKEN_KEY);
    dispatch(clearAuth());
    router.replace('/(auth)/login');
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Pressable style={[styles.loginBtn, { backgroundColor: colors.navy }]} onPress={() => router.push('/(auth)/login')}>
          <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <View style={[styles.profileBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accentBlue }]}>
            <Ionicons name="person" size={40} color={colors.navy} />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user.full_name}</Text>
          <Text style={{ color: colors.textSecondary }}>{user.email}</Text>
          {patient?.blood_group ? <Text style={{ color: colors.accentTeal, marginTop: 4 }}>Blood Group: {patient.blood_group}</Text> : null}
        </View>

        {MENU_ITEMS.map((item) => (
          <Pressable key={item.route} style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(item.route as never)}>
            <Ionicons name={item.icon} size={22} color={colors.accentTeal} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}

        <Pressable style={[styles.logoutBtn, { backgroundColor: colors.accentRed }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.accentRedText} />
          <Text style={[styles.logoutText, { color: colors.accentRedText }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: LuminaSpacing.lg },
  title: { ...LuminaTypography.h1, marginBottom: LuminaSpacing.lg, marginTop: LuminaSpacing.md },
  profileBox: { alignItems: 'center', padding: LuminaSpacing.xl, borderRadius: LuminaRadius.lg, borderWidth: 1, marginBottom: LuminaSpacing.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: LuminaSpacing.md },
  name: { ...LuminaTypography.h2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md, padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1, marginBottom: LuminaSpacing.sm },
  menuLabel: { ...LuminaTypography.body, flex: 1, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: LuminaSpacing.sm, height: 48, borderRadius: LuminaRadius.md, marginTop: LuminaSpacing.lg },
  logoutText: { fontSize: 16, fontWeight: '600' },
  loginBtn: { margin: LuminaSpacing.xl, padding: LuminaSpacing.lg, borderRadius: LuminaRadius.md, alignItems: 'center' },
});
