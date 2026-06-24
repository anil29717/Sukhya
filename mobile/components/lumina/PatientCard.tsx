/**
 * PatientCard — used in doctor's patient list.
 * DoctorCard — used in patient's doctor search.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

const CONDITION_COLORS: Record<string, { bg: string; color: string }> = {
  diabetes: { bg: '#FEF3C7', color: '#B45309' },
  hypertension: { bg: '#FEE2E2', color: '#B91C1C' },
  asthma: { bg: '#E0F2FE', color: '#0369A1' },
  heart: { bg: '#FEE2E2', color: '#B91C1C' },
  thyroid: { bg: '#EDE9FE', color: '#6D28D9' },
  default: { bg: '#F1F3F5', color: '#495057' },
};

function getConditionColor(condition: string) {
  const key = condition.toLowerCase();
  for (const k of Object.keys(CONDITION_COLORS)) {
    if (key.includes(k)) return CONDITION_COLORS[k];
  }
  return CONDITION_COLORS.default;
}

function ConditionChip({ label }: { label: string }) {
  const { bg, color } = getConditionColor(label);
  return (
    <View style={[styles.condChip, { backgroundColor: bg }]}>
      <Text style={[styles.condChipText, { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ─── Patient Card ─────────────────────────────────────────────────────────────

type PatientCardProps = {
  name: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  conditions?: string[];
  lastVisit?: string;
  hasFollowUp?: boolean;
  onPress?: () => void;
};

export function PatientCard({
  name,
  age,
  gender,
  bloodGroup,
  conditions = [],
  lastVisit,
  hasFollowUp,
  onPress,
}: PatientCardProps) {
  const { colors } = useLuminaTheme({ role: 'doctor' });

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const meta = [gender, bloodGroup].filter(Boolean).join(' • ');

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress?.(); }}
      style={({ pressed }) => [
        styles.card,
        LuminaShadow.sm,
        { backgroundColor: colors.surface, opacity: pressed ? 0.82 : 1 },
      ]}
      accessibilityRole="button"
    >
      <View style={styles.mainRow}>
        <View style={[styles.avatar, { backgroundColor: colors.tealSoft }]}>
          <Text style={[styles.avatarText, { color: colors.teal }]}>{initials}</Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {[age ? `${age} yrs` : null, meta].filter(Boolean).join(' • ') || 'No details'}
          </Text>
          {lastVisit ? (
            <Text style={[styles.lastVisit, { color: colors.textMuted }]}>Last visit: {lastVisit}</Text>
          ) : null}
        </View>

        <View style={styles.right}>
          {hasFollowUp ? (
            <View style={styles.followUpRow}>
              <View style={[styles.followUpDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.followUpText, { color: colors.warning }]}>Follow-up</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </View>

      {conditions.length > 0 ? (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.chipsRow}>
            {conditions.slice(0, 3).map((c) => (
              <ConditionChip key={c} label={c} />
            ))}
            {conditions.length > 3 ? (
              <View style={[styles.condChip, { backgroundColor: colors.neutral100 }]}>
                <Text style={[styles.condChipText, { color: colors.textSecondary }]}>
                  +{conditions.length - 3}
                </Text>
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

// ─── Doctor Card ──────────────────────────────────────────────────────────────

type DoctorCardProps = {
  name: string;
  specialty?: string;
  rating?: number;
  fee?: number | string;
  available?: boolean;
  onPress?: () => void;
  onBook?: () => void;
};

export function DoctorCard({
  name,
  specialty,
  rating,
  fee,
  available = true,
  onPress,
  onBook,
}: DoctorCardProps) {
  const { colors } = useLuminaTheme({ role: 'patient' });

  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress?.(); }}
      style={({ pressed }) => [
        styles.docCard,
        LuminaShadow.sm,
        { backgroundColor: colors.surface, opacity: pressed ? 0.88 : 1 },
      ]}
      accessibilityRole="button"
    >
      {/* Top row: avatar + info */}
      <View style={styles.docTopRow}>
        <View style={[styles.docAvatar, { backgroundColor: colors.coralSoft }]}>
          <Text style={[styles.docAvatarText, { color: colors.coral }]}>{initials}</Text>
        </View>

        <View style={styles.docInfo}>
          <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
          <View style={styles.docMetaRow}>
            {specialty ? (
              <View style={[styles.docSpecChip, { backgroundColor: colors.tealSoft }]}>
                <Ionicons name="medkit-outline" size={10} color={colors.teal} />
                <Text style={[styles.docSpecText, { color: colors.teal }]}>{specialty}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.docStatsRow}>
            {rating != null ? (
              <View style={styles.docRatingRow}>
                <Ionicons name="star" size={11} color="#F79009" />
                <Text style={[styles.docStatText, { color: colors.textSecondary }]}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {fee != null ? (
              <View style={[styles.docFeeChip, { backgroundColor: colors.coralSoft }]}>
                <Text style={[styles.docFeeText, { color: colors.coral }]}>₹{fee}</Text>
              </View>
            ) : null}
            {!available ? (
              <View style={[styles.docUnavailChip, { backgroundColor: colors.errorSoft }]}>
                <Text style={[styles.docUnavailText, { color: colors.error }]}>Unavailable</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>

      {/* Divider + Book button */}
      {onBook && available ? (
        <>
          <View style={[styles.docDivider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={(e) => { e.stopPropagation(); triggerHaptic('medium'); onBook(); }}
            style={[styles.docBookBtn, { backgroundColor: colors.coral }]}
            accessibilityRole="button"
            accessibilityLabel={`Book appointment with ${name}`}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
            <Text style={styles.docBookText}>Book Appointment</Text>
          </Pressable>
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.lg,
    padding: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 17, fontFamily: LuminaFontFamily.nunitoBold },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  meta: { fontSize: 13, fontFamily: LuminaFontFamily.dmSansRegular },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lastVisit: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansRegular },
  right: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  followUpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  followUpDot: { width: 6, height: 6, borderRadius: 3 },
  followUpText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
  divider: { height: 1, marginVertical: LuminaSpacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  condChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  condChipText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
  // Doctor Card new styles
  docCard: {
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
    overflow: 'hidden',
  },
  docTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: LuminaSpacing.md },
  docAvatar: {
    width: 54,
    height: 54,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docAvatarText: { fontSize: 20, fontFamily: LuminaFontFamily.nunitoBold },
  docInfo: { flex: 1, gap: 5 },
  docName: { fontFamily: LuminaFontFamily.nunitoSemiBold, fontSize: 17, lineHeight: 22 },
  docMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docSpecChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LuminaRadius.full,
  },
  docSpecText: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansMedium },
  docStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  docRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  docStatText: { fontSize: 12, fontFamily: LuminaFontFamily.dmSansRegular },
  docFeeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LuminaRadius.full,
  },
  docFeeText: { fontSize: 12, fontFamily: LuminaFontFamily.dmSansMedium },
  docUnavailChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: LuminaRadius.full },
  docUnavailText: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansMedium },
  docDivider: { height: 1, marginVertical: LuminaSpacing.md },
  docBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: LuminaRadius.lg,
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  docBookText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
