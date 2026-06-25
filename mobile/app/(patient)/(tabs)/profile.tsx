import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMyPatientProfile } from '@/api/patients';
import { RootState } from '@/store/store';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';
import { performLogout } from '@/utils/session';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  route: string;
  iconColor: string;
  iconBg: string;
};

const MENU_GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Account',
    items: [
      {
        icon: 'person-outline',
        label: 'Edit Profile',
        sublabel: 'Name, phone & blood group',
        route: '/(patient)/profile/edit',
        iconColor: '#F05A2A',
        iconBg: '#FEF0EB',
      },
      {
        icon: 'medical-outline',
        label: 'Medical Information',
        sublabel: 'Allergies & health history',
        route: '/(patient)/profile/medical',
        iconColor: '#0BA5EC',
        iconBg: '#E0F2FE',
      },
      {
        icon: 'call-outline',
        label: 'Emergency Contacts',
        sublabel: 'Who to call in an emergency',
        route: '/(patient)/profile/emergency',
        iconColor: '#F04438',
        iconBg: '#FEE2E2',
      },
    ],
  },
  {
    title: 'Health',
    items: [
      {
        icon: 'people-outline',
        label: 'Family Members',
        sublabel: 'Manage dependents',
        route: '/(patient)/family',
        iconColor: '#7C3AED',
        iconBg: '#EDE9FE',
      },
      {
        icon: 'calendar-outline',
        label: 'Appointments',
        sublabel: 'Upcoming & past visits',
        route: '/(patient)/appointments',
        iconColor: '#F79009',
        iconBg: '#FEF3C7',
      },
      {
        icon: 'medkit-outline',
        label: 'Medications',
        sublabel: 'Track doses & schedules',
        route: '/(patient)/medications',
        iconColor: '#0D9B76',
        iconBg: '#D1FAE5',
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        icon: 'notifications-outline',
        label: 'Notifications',
        sublabel: 'Alerts & reminders',
        route: '/(patient)/notifications',
        iconColor: '#F79009',
        iconBg: '#FEF3C7',
      },
      {
        icon: 'settings-outline',
        label: 'Settings',
        sublabel: 'Privacy & app preferences',
        route: '/(patient)/settings',
        iconColor: '#868E96',
        iconBg: '#F1F3F5',
      },
    ],
  },
];

function MenuRow({
  item,
  colors,
  onPress,
  isLast,
}: {
  item: MenuItem;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        menuStyles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        { opacity: pressed ? 0.82 : 1 },
      ]}
      accessibilityRole="button"
    >
      <View style={[menuStyles.iconWrap, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <View style={menuStyles.textBlock}>
        <Text style={[menuStyles.label, { color: colors.text }]}>{item.label}</Text>
        {item.sublabel ? (
          <Text style={[menuStyles.sublabel, { color: colors.textMuted }]} numberOfLines={1}>
            {item.sublabel}
          </Text>
        ) : null}
      </View>
      <View style={[menuStyles.chevronWrap, { backgroundColor: colors.neutral100 }]}>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: LuminaSpacing.lg,
    minHeight: 64,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: { flex: 1, gap: 2 },
  label: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  sublabel: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { user } = useSelector((s: RootState) => s.auth);

  const { data: patient } = useQuery({
    queryKey: ['patient-me'],
    queryFn: getMyPatientProfile,
    enabled: !!user,
  });

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your health records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('light');
          await performLogout();
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.signInWrap}>
          <View style={[styles.signInIcon, { backgroundColor: colors.coralSoft }]}>
            <Ionicons name="person-outline" size={40} color={colors.coral} />
          </View>
          <Text style={[styles.signInTitle, { color: colors.text }]}>Your health profile</Text>
          <Text style={[styles.signInSub, { color: colors.textSecondary }]}>
            Sign in to manage appointments, records, and medications.
          </Text>
          <Pressable
            style={[styles.signInBtn, { backgroundColor: colors.coral }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const initials =
    (user.full_name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Coral hero */}
        <View style={[styles.hero, { paddingTop: insets.top + LuminaSpacing.lg, backgroundColor: colors.coral }]}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>Profile</Text>
            <Pressable
              onPress={() => { triggerHaptic('light'); router.push('/(patient)/settings'); }}
              style={styles.heroSettingsBtn}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Floating identity card */}
        <View style={[styles.identityCard, LuminaShadow.md, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatarRing, { borderColor: colors.coral + '33' }]}>
            <View style={[styles.avatar, { backgroundColor: colors.coralSoft }]}>
              <Text style={[styles.avatarText, { color: colors.coral }]}>{initials}</Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user.full_name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>

          <View style={styles.chipRow}>
            {patient?.blood_group ? (
              <View style={[styles.chip, { backgroundColor: colors.tealSoft }]}>
                <Ionicons name="water-outline" size={12} color={colors.teal} />
                <Text style={[styles.chipText, { color: colors.teal }]}>{patient.blood_group}</Text>
              </View>
            ) : null}
            {user.phone ? (
              <View style={[styles.chip, { backgroundColor: colors.neutral100 }]}>
                <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>{user.phone}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => { triggerHaptic('light'); router.push('/(patient)/profile/edit'); }}
            style={[styles.editBtn, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '44' }]}
          >
            <Ionicons name="create-outline" size={16} color={colors.coral} />
            <Text style={[styles.editBtnText, { color: colors.coral }]}>Edit profile</Text>
          </Pressable>
        </View>

        {/* Menu groups */}
        <View style={styles.menuWrap}>
          {MENU_GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={[styles.groupTitle, { color: colors.coral }]}>{group.title.toUpperCase()}</Text>
              <View
                style={[
                  styles.sectionCard,
                  LuminaShadow.sm,
                  { backgroundColor: colors.surface, borderColor: 'rgba(255,255,255,0.65)' },
                ]}
              >
                {group.items.map((item, idx) => (
                  <MenuRow
                    key={item.route}
                    item={item}
                    colors={colors}
                    isLast={idx === group.items.length - 1}
                    onPress={() => { triggerHaptic('light'); router.push(item.route as never); }}
                  />
                ))}
              </View>
            </View>
          ))}

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              { borderColor: colors.errorText + '33', backgroundColor: colors.errorSoft, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.errorText} />
            <Text style={[styles.logoutText, { color: colors.errorText }]}>Sign out</Text>
          </Pressable>

          <Text style={[styles.version, { color: colors.textMuted }]}>Sukhya Health · Patient</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: 56,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -50,
  },
  heroDecor2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 10,
    left: -20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSettingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    marginHorizontal: LuminaSpacing.xl,
    marginTop: -40,
    borderRadius: LuminaRadius.xl + 4,
    padding: LuminaSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 44,
    borderWidth: 2,
    marginBottom: LuminaSpacing.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontFamily: LuminaFontFamily.nunitoBold },
  name: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  email: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: LuminaSpacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: LuminaRadius.full,
  },
  chipText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 12 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: LuminaSpacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
  },
  editBtnText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 14 },
  menuWrap: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.xl },
  group: { marginBottom: LuminaSpacing.lg },
  groupTitle: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginTop: LuminaSpacing.sm,
  },
  logoutText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15 },
  version: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    marginTop: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
  },
  signInWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.xxl,
    gap: 12,
  },
  signInIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  signInTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 22, textAlign: 'center' },
  signInSub: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  signInBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: LuminaRadius.lg,
    marginTop: 8,
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  signInBtnText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16, color: '#FFFFFF' },
});
