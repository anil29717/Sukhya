import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getFamilyMember, deleteFamilyMember } from '@/api/family';
import { getUpcomingAppointments } from '@/api/appointments';
import { formatDoctorName } from '@/api/types';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

function InfoRow({
  icon,
  label,
  value,
  colors,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        infoStyles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[infoStyles.iconWrap, { backgroundColor: colors.neutral100 }]}>
        <Ionicons name={icon} size={15} color={colors.coral} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.text }]} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: LuminaRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
});

function getMemberDisplayName(member: { full_name?: string | null; nickname?: string | null; dependent?: { display_name?: string | null } }): string {
  return (
    member.full_name?.trim() ||
    member.nickname?.trim() ||
    member.dependent?.display_name?.trim() ||
    'Family member'
  );
}

function getInitials(name?: string | null) {
  const safe = (name ?? '').trim();
  if (!safe) return '?';
  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

export default function FamilyMemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { switchToFamilyMember, activePatientId } = useActivePatient();

  const { data: member, isLoading, error, refetch } = useQuery({
    queryKey: ['family-member', id],
    queryFn: () => getFamilyMember(parseInt(id!, 10)),
    enabled: !!id,
  });

  const patientId = member?.dependent?.patient_id;
  const isActive = patientId != null && activePatientId === patientId;

  const { data: appts } = useQuery({
    queryKey: ['appointments-upcoming-family', patientId],
    queryFn: () => getUpcomingAppointments(),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFamilyMember(parseInt(id!, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      router.back();
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Family Member" role="patient" />
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  if (error || !member) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Family Member" role="patient" />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  const displayName = getMemberDisplayName(member);
  const relLabel = (member.relationship ?? 'other').charAt(0).toUpperCase() + (member.relationship ?? 'other').slice(1);
  const upcoming = appts?.items?.slice(0, 3) ?? [];

  const handleRemove = () => {
    Alert.alert(
      'Remove family member?',
      `${displayName} will be removed from your account. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={displayName} subtitle={relLabel} role="patient" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.heroCard, LuminaShadow.md, { backgroundColor: colors.surface }]}>
          <View style={[styles.heroAccent, { backgroundColor: '#7C3AED' }]} />
          <View style={styles.heroInner}>
            <View style={[styles.avatar, { backgroundColor: '#EDE9FE' }]}>
              <Text style={[styles.initials, { color: '#7C3AED' }]}>{getInitials(displayName)}</Text>
            </View>
            {isActive ? (
              <View style={[styles.activeBadge, { backgroundColor: colors.coralSoft }]}>
                <View style={[styles.activeDot, { backgroundColor: colors.coral }]} />
                <Text style={[styles.activeText, { color: colors.coral }]}>Active profile</Text>
              </View>
            ) : null}
            <Text style={[styles.heroName, { color: colors.text }]}>{displayName}</Text>
            <View style={[styles.relBadge, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="people-outline" size={12} color="#7C3AED" />
              <Text style={[styles.relText, { color: '#7C3AED' }]}>{relLabel}</Text>
            </View>
          </View>
        </View>

        {/* Health info */}
        <View style={[styles.detailsCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.coral }]}>HEALTH INFO</Text>
          <InfoRow icon="water-outline" label="Blood group" value={member.blood_group ?? 'Not set'} colors={colors} />
          <InfoRow icon="warning-outline" label="Allergies" value={member.allergies ?? 'None recorded'} colors={colors} />
          <InfoRow
            icon="call-outline"
            label="Emergency contact"
            value={
              member.emergency_contact_name
                ? `${member.emergency_contact_name}${member.emergency_contact_phone ? ` · ${member.emergency_contact_phone}` : ''}`
                : 'Not set'
            }
            colors={colors}
            isLast
          />
        </View>

        {/* Appointments */}
        <Text style={[styles.outsideLabel, { color: colors.textSecondary }]}>Upcoming appointments</Text>
        <View style={[styles.apptCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
          {upcoming.length > 0 ? (
            upcoming.map((a, i) => (
              <View
                key={a.id}
                style={[
                  styles.apptRow,
                  i < upcoming.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.apptIcon, { backgroundColor: colors.coralSoft }]}>
                  <Ionicons name="calendar-outline" size={16} color={colors.coral} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.apptDate, { color: colors.text }]}>
                    {new Date(a.appointment_date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text style={[styles.apptDoctor, { color: colors.textSecondary }]}>
                    {formatDoctorName(a.doctor?.full_name)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyAppt}>
              <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
              <Text style={[styles.emptyApptText, { color: colors.textMuted }]}>No upcoming appointments</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          LuminaShadow.nav,
        ]}
      >
        {!isActive && patientId ? (
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              switchToFamilyMember(patientId, displayName);
              router.back();
            }}
            style={[styles.footerBtn, { backgroundColor: colors.coral }]}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#FFFFFF" />
            <Text style={styles.footerBtnPrimaryText}>Switch to this profile</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => { triggerHaptic('light'); router.push('/(patient)/(tabs)/doctors'); }}
            style={[styles.footerBtn, { backgroundColor: colors.coral }]}
          >
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            <Text style={styles.footerBtnPrimaryText}>Book appointment</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleRemove}
          disabled={deleteMutation.isPending}
          style={styles.removeBtn}
        >
          <Ionicons name="trash-outline" size={16} color={colors.errorText} />
          <Text style={[styles.removeText, { color: colors.errorText }]}>Remove member</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.sm,
    gap: LuminaSpacing.lg,
  },
  heroCard: {
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  heroAccent: { height: 4 },
  heroInner: { alignItems: 'center', padding: LuminaSpacing.xl, gap: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  initials: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 24 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 11 },
  heroName: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  relBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
  },
  relText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 12 },
  detailsCard: {
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: LuminaSpacing.lg,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
    marginTop: 4,
  },
  outsideLabel: {
    fontFamily: LuminaFontFamily.nunitoSemiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    marginBottom: -4,
  },
  apptCard: {
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: LuminaSpacing.lg,
  },
  apptIcon: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptDate: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 14 },
  apptDoctor: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  emptyAppt: {
    alignItems: 'center',
    padding: LuminaSpacing.xxl,
    gap: 8,
  },
  emptyApptText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  footerBtnPrimaryText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
  },
  removeText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
});
