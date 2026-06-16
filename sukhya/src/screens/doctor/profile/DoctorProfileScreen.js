import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatCurrency } from '../../../utils/format';

// ─── API ──────────────────────────────────────────────────────────
const fetchDoctorMe = () => apiFetch('/doctors/me');

// ─── Menu item ────────────────────────────────────────────────────
function MenuItem({ icon, label, value, onPress, iconBg, iconColor, showArrow = true, danger, colors }) {
  return (
    <TouchableOpacity
      style={[menuS.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[menuS.iconWrap, { backgroundColor: iconBg ?? colors.tealLight }]}>
        <Ionicons name={icon} size={17} color={iconColor ?? colors.teal} />
      </View>
      <View style={menuS.texts}>
        <Text style={[menuS.label, { color: danger ? colors.error : colors.textPrimary }]}>
          {label}
        </Text>
        {value && (
          <Text style={[menuS.value, { color: colors.textSecondary }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const menuS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    gap: Spacing[3],
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
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
  value: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginTop: 1 },
});

// ─── Section card ─────────────────────────────────────────────────
function SectionCard({ label, children, colors }) {
  return (
    <View style={[secS.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      {label && <Text style={[secS.label, { color: colors.teal }]}>{label}</Text>}
      {children}
    </View>
  );
}

const secS = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3] },
});

// ─── Stat chip ────────────────────────────────────────────────────
function StatChip({ value, label, colors }) {
  return (
    <View style={statS.chip}>
      <Text style={[statS.value, { color: colors.teal }]}>{value}</Text>
      <Text style={[statS.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statS = StyleSheet.create({
  chip: { flex: 1, alignItems: 'center', paddingVertical: Spacing[3] },
  value: { fontFamily: FontFamily.dmMonoMedium, fontSize: 20, marginBottom: 3 },
  label: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, textAlign: 'center' },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function DoctorProfileScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: doctor, refetch } = useQuery({
    queryKey: ['doctor-me'],
    queryFn: fetchDoctorMe,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  const initials = (user?.full_name ?? 'DR')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />

      {/* Teal hero header */}
      <View style={[styles.tealHeader, { backgroundColor: colors.teal }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </SafeAreaView>

        {/* Avatar overlapping header */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.50)' }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Verified badge */}
          {doctor?.is_approved && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Name + specialty */}
        <View style={styles.nameBlock}>
          <Text style={styles.docName}>{user?.full_name ?? 'Doctor'}</Text>
          <Text style={styles.docSpecialty}>
            {doctor?.specialization ?? user?.doctor_profile?.specialization ?? 'Specialist'}
          </Text>
          <View style={styles.hospitalRow}>
            <Ionicons name="business-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.hospitalText}>
              {doctor?.hospital_name ?? user?.doctor_profile?.hospital_name ?? 'Hospital'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
        }
      >
        {/* Quick stats */}
        <View style={[styles.statsCard, Shadow.md, { backgroundColor: colors.surface }]}>
          <StatChip value={doctor?.years_experience ? `${doctor.years_experience}yr` : '—'} label="Experience" colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatChip value={doctor?.total_appointments ?? '—'} label="Appointments" colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatChip value={doctor?.consultation_fee ? formatCurrency(doctor.consultation_fee) : '—'} label="Fee" colors={colors} />
        </View>

        {/* Professional */}
        <SectionCard label="PROFESSIONAL" colors={colors}>
          <MenuItem icon="person-outline"     label="Edit Profile"          value="Update your details"          onPress={() => navigation.navigate('EditDoctorProfile')} colors={colors} />
          <MenuItem icon="calendar-outline"   label="Availability"          value="Set your working hours"        onPress={() => navigation.navigate('Availability')}      colors={colors} />
          <MenuItem icon="airplane-outline"   label="Leave Management"      value="Mark days off"                 onPress={() => navigation.navigate('LeaveManagement')}   colors={colors} />
          <MenuItem icon="settings-outline"   label="Scheduling Settings"   value="Buffer time & max appointments" onPress={() => navigation.navigate('SchedulingSettings')} colors={colors} />
          <MenuItem icon="bar-chart-outline"  label="Analytics"             value="View your performance"         onPress={() => navigation.navigate('DashboardTab', { screen: 'DoctorAnalytics' })} colors={colors} isLast />
        </SectionCard>

        {/* App settings */}
        <SectionCard label="APP SETTINGS" colors={colors}>
          <MenuItem
            icon="moon-outline"
            label="Appearance"
            value={isDark ? 'Dark mode' : 'Light mode'}
            iconBg={isDark ? '#1A1D27' : '#F1F3F5'}
            iconColor={isDark ? '#F1F3F5' : '#495057'}
            onPress={() => {}}
            colors={colors}
          />
          <MenuItem
            icon="language-outline"
            label="Language"
            value="English"
            iconBg="#E0F2FE"
            iconColor="#0369A1"
            onPress={() => {}}
            colors={colors}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            value="Manage preferences"
            iconBg="#FEF3C7"
            iconColor="#B45309"
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </SectionCard>

        {/* Privacy & data */}
        <SectionCard label="PRIVACY & DATA" colors={colors}>
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy & Data"
            value="DPDPA 2023 compliance"
            iconBg="#EDE9FE"
            iconColor="#7C3AED"
            onPress={() => {}}
            colors={colors}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => {}}
            colors={colors}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About Sukhya"
            value="v1.0.0"
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </SectionCard>

        {/* Account */}
        <SectionCard colors={colors}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            iconBg={colors.errorBg}
            iconColor={colors.error}
            danger
            showArrow={false}
            colors={colors}
            isLast
          />
        </SectionCard>

        {/* DPDPA footer */}
        <Text style={[styles.dpdpaNote, { color: colors.textSecondary }]}>
          Questions about your data? Email{' '}
          <Text style={{ color: colors.teal }}>privacy@sukhya.in</Text>
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Teal header ──
  tealHeader: {
    paddingBottom: Spacing[5],
    paddingHorizontal: Spacing[5],
  },
  headerContent: {
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
    position: 'relative',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.nunitoExtraBold,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0D9B76',
  },
  nameBlock: { alignItems: 'center', gap: 4 },
  docName: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  docSpecialty: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.82)',
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hospitalText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.70)',
  },

  // ── Stats card ──
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    marginTop: -20,
    marginBottom: Spacing[4],
  },
  statDivider: { width: 1, height: 36 },

  // ── Scroll ──
  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[2] },

  dpdpaNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[4],
  },
});