import React, { useState, useCallback } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { getMyDoctorProfile } from '@/api/doctor';
import { RootState } from '@/store/store';
import { performLogout } from '@/utils/session';
import { LuminaFontFamily, LuminaRadius, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const STAT_HEIGHT = 88;
const STAT_OVERLAP = STAT_HEIGHT / 2;
const H_PAD = LuminaSpacing.xl;

// ─── Stat card (matches doctor dashboard) ─────────────────────────────────────

function StatCard({
  value,
  label,
  valueColor,
  surfaceColor,
  valueSize = 28,
}: {
  value: string;
  label: string;
  valueColor: string;
  surfaceColor: string;
  valueSize?: number;
}) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  return (
    <View style={[statStyles.card, { backgroundColor: surfaceColor }]}>
      <Text
        style={[statStyles.value, { color: valueColor, fontSize: valueSize, lineHeight: valueSize + 6 }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    height: STAT_HEIGHT,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  value: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    marginBottom: 3,
    textAlign: 'center',
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
  },
});

// ─── Menu item ────────────────────────────────────────────────────────────────

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  iconBg?: string;
  iconColor?: string;
  onPress?: () => void;
  danger?: boolean;
  showArrow?: boolean;
  isLast?: boolean;
  surfaceColor: string;
  borderColor: string;
};

function MenuItem({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  onPress,
  danger,
  showArrow = true,
  isLast,
  borderColor,
}: MenuItemProps) {
  const { colors } = useLuminaTheme({ role: 'doctor' });
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        menuS.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor },
        { opacity: pressed ? 0.75 : 1 },
      ]}
      accessibilityRole="button"
    >
      <View style={[menuS.iconWrap, { backgroundColor: iconBg ?? '#E6F7F2' }]}>
        <Ionicons name={icon} size={17} color={iconColor ?? '#0D9B76'} />
      </View>
      <View style={menuS.texts}>
        <Text style={[menuS.label, { color: danger ? '#F04438' : colors.text }]}>{label}</Text>
        {value ? (
          <Text style={[menuS.value, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text>
        ) : null}
      </View>
      {showArrow ? (
        <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const menuS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: LuminaSpacing.md,
    gap: LuminaSpacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texts: { flex: 1 },
  label: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14, lineHeight: 20 },
  value: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11, marginTop: 1 },
});

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  label,
  children,
  surfaceColor,
}: {
  label?: string;
  children: React.ReactNode;
  surfaceColor: string;
}) {
  return (
    <View
      style={[
        secS.card,
        { backgroundColor: surfaceColor },
      ]}
    >
      {label ? <Text style={secS.sectionLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

const secS = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: LuminaSpacing.lg,
    paddingVertical: LuminaSpacing.xs,
    marginBottom: LuminaSpacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 10,
    letterSpacing: 0.9,
    color: '#0D9B76',
    paddingTop: LuminaSpacing.md,
    paddingBottom: LuminaSpacing.sm,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DoctorProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, isDark } = useLuminaTheme({ role: 'doctor' });
  const { user } = useSelector((s: RootState) => s.auth);
  const [refreshing, setRefreshing] = useState(false);

  const { data: doctor, refetch } = useQuery({
    queryKey: ['doctor-me'],
    queryFn: getMyDoctorProfile,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performLogout },
      ]
    );
  };

  const initials = (user?.full_name ?? 'DR')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const specialization = doctor?.specialization ?? null;
  const clinicName = (doctor as any)?.clinic_name ?? null;
  const isApproved = (doctor as any)?.user?.is_approved ?? false;
  const fee = doctor?.consultation_fee;
  const feeStr = fee != null ? `₹${fee.toLocaleString('en-IN')}` : '—';
  const expStr = doctor?.experience_years != null ? `${doctor.experience_years}yr` : '—';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Fixed teal header + floating stat cards ── */}
      <View style={styles.headerWrapper}>
        <View
          style={[
            styles.tealHeader,
            {
              backgroundColor: colors.teal,
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {isApproved ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            ) : null}
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.docName}>{user?.full_name ?? 'Doctor'}</Text>
            {specialization ? (
              <Text style={styles.docSpecialty}>{specialization}</Text>
            ) : null}
            {clinicName ? (
              <View style={styles.hospitalRow}>
                <Ionicons name="business-outline" size={12} color="rgba(255,255,255,0.70)" />
                <Text style={styles.hospitalText}>{clinicName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <StatCard
              value={expStr}
              label="Experience"
              valueColor={colors.teal}
              surfaceColor={colors.surface}
            />
            <StatCard
              value={specialization ?? '—'}
              label="Specialty"
              valueColor={colors.teal}
              surfaceColor={colors.surface}
              valueSize={14}
            />
            <StatCard
              value={feeStr}
              label="Fee"
              valueColor={colors.teal}
              surfaceColor={colors.surface}
            />
          </View>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
        }
      >
        {/* ── PROFESSIONAL ── */}
        <SectionCard label="PROFESSIONAL" surfaceColor={colors.surface}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            value="Update your details"
            iconBg="#E6F7F2"
            iconColor="#0D9B76"
            onPress={() => router.push('/(doctor)/profile/edit' as never)}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="calendar-outline"
            label="Availability"
            value="Set your working hours"
            iconBg="#E6F7F2"
            iconColor="#0D9B76"
            onPress={() => router.push('/(doctor)/(tabs)/schedule' as never)}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="airplane-outline"
            label="Leave Management"
            value="Mark days off"
            iconBg="#E6F7F2"
            iconColor="#0D9B76"
            onPress={() => router.push('/(doctor)/(tabs)/schedule' as never)}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="options-outline"
            label="Scheduling Settings"
            value="Buffer time & max appointments"
            iconBg="#E6F7F2"
            iconColor="#0D9B76"
            onPress={() => router.push('/(doctor)/(tabs)/schedule' as never)}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="bar-chart-outline"
            label="Analytics"
            value="View your performance"
            iconBg="#E6F7F2"
            iconColor="#0D9B76"
            onPress={() => router.push('/(doctor)/profile/analytics' as never)}
            surfaceColor={colors.surface}
            borderColor={colors.border}
            isLast
          />
        </SectionCard>

        {/* ── APP SETTINGS ── */}
        <SectionCard label="APP SETTINGS" surfaceColor={colors.surface}>
          <MenuItem
            icon="moon-outline"
            label="Appearance"
            value={isDark ? 'Dark mode' : 'Light mode'}
            iconBg={isDark ? '#1F2937' : '#F3F4F6'}
            iconColor={isDark ? '#E5E7EB' : '#374151'}
            onPress={() => {
              Alert.alert(
                'Appearance',
                'Theme follows your device\'s system setting (Settings → Display → Dark Mode).',
                [{ text: 'OK' }]
              );
            }}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="language-outline"
            label="Language"
            value="English"
            iconBg="#E0F2FE"
            iconColor="#0369A1"
            onPress={() => {}}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            value="Manage preferences"
            iconBg="#FEF3C7"
            iconColor="#B45309"
            onPress={() => router.push('/(doctor)/notifications' as never)}
            surfaceColor={colors.surface}
            borderColor={colors.border}
            isLast
          />
        </SectionCard>

        {/* ── PRIVACY & DATA ── */}
        <SectionCard label="PRIVACY & DATA" surfaceColor={colors.surface}>
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy & Data"
            value="DPDPA 2023 compliance"
            iconBg="#EDE9FE"
            iconColor="#7C3AED"
            onPress={() => {}}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            iconBg="#F3F4F6"
            iconColor="#374151"
            onPress={() => {}}
            surfaceColor={colors.surface}
            borderColor={colors.border}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About Lumina Health"
            value="v1.0.0"
            iconBg="#E6F7F2"
            iconColor="#0D9B76"
            onPress={() => {}}
            surfaceColor={colors.surface}
            borderColor={colors.border}
            isLast
          />
        </SectionCard>

        {/* ── SIGN OUT ── */}
        <SectionCard surfaceColor={colors.surface}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            iconBg="#FEE2E2"
            iconColor="#F04438"
            onPress={handleSignOut}
            danger
            showArrow={false}
            surfaceColor={colors.surface}
            borderColor={colors.border}
            isLast
          />
        </SectionCard>

        {/* DPDPA footer */}
        <Text style={[styles.dpdpaNote, { color: colors.textSecondary }]}>
          Questions about your data? Email{' '}
          <Text style={{ color: colors.teal }}>privacy@luminahealth.in</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  headerWrapper: {
    position: 'relative',
    zIndex: 10,
  },

  // ── Teal header ──
  tealHeader: {
    paddingHorizontal: H_PAD,
    paddingBottom: STAT_OVERLAP + LuminaSpacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  titleRow: {
    alignItems: 'center',
    paddingTop: LuminaSpacing.md,
    paddingBottom: LuminaSpacing.sm,
  },
  headerTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 17,
    color: '#FFFFFF',
  },

  // Avatar
  avatarWrap: {
    alignSelf: 'center',
    marginTop: LuminaSpacing.sm,
    marginBottom: LuminaSpacing.md,
    position: 'relative',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: LuminaFontFamily.nunitoExtraBold,
    fontSize: 30,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#12B76A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0D9B76',
  },

  // Name block
  nameBlock: { alignItems: 'center', gap: 3 },
  docName: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  docSpecialty: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hospitalText: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.70)',
  },

  // ── Floating stat cards (matches dashboard) ──
  statsOverlay: {
    position: 'absolute',
    left: H_PAD,
    right: H_PAD,
    bottom: -STAT_OVERLAP,
    zIndex: 20,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: LuminaSpacing.sm,
  },

  // ── Scroll ──
  scroll: {
    paddingHorizontal: H_PAD,
    paddingTop: STAT_OVERLAP + LuminaSpacing.lg,
  },

  // DPDPA footer
  dpdpaNote: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: LuminaSpacing.xs,
    marginBottom: LuminaSpacing.lg,
  },
});
