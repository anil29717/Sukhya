/**
 * Teal hero header with optional floating stat cards overlay.
 * Used on doctor dashboard, doctor profile tab root.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

export type HeroStat = {
  value: string | number;
  label: string;
  valueColor?: string;
};

type HeroHeaderProps = {
  name: string;
  subtitle?: string;
  /** Avatar initials (1–2 chars) */
  initials?: string;
  /** Badge count on notification bell */
  notifCount?: number;
  onNotifPress?: () => void;
  /** Stats shown floating below the hero (max 3) */
  stats?: HeroStat[];
  role?: 'doctor' | 'patient';
};

const STAT_CARD_HEIGHT = 88;
const STAT_OVERLAP = STAT_CARD_HEIGHT / 2;

export function HeroHeader({
  name,
  subtitle,
  initials,
  notifCount = 0,
  onNotifPress,
  stats,
  role = 'doctor',
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role });

  const heroColor = role === 'doctor' ? colors.teal : colors.coral;
  const heroDark = role === 'doctor' ? colors.tealSoft : colors.coralSoft;

  return (
    <View style={{ marginBottom: stats?.length ? STAT_OVERLAP + LuminaSpacing.sm : 0 }}>
      {/* Teal hero block */}
      <View
        style={[
          styles.hero,
          {
            paddingTop: insets.top + LuminaSpacing.lg,
            backgroundColor: heroColor,
            paddingBottom: stats?.length ? STAT_OVERLAP + LuminaSpacing.md : LuminaSpacing.xl,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.20)' }]}>
            {initials ? (
              <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
            ) : (
              <Ionicons name="person" size={20} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.nameBlock}>
            {subtitle ? (
              <Text style={styles.greeting}>{subtitle}</Text>
            ) : null}
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
          </View>

          {/* Notification bell */}
          {onNotifPress ? (
            <Pressable
              onPress={() => { triggerHaptic('light'); onNotifPress(); }}
              style={styles.notifBtn}
              hitSlop={8}
            >
              <Ionicons name={notifCount > 0 ? 'notifications' : 'notifications-outline'} size={22} color="#FFFFFF" />
              {notifCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Floating stat cards */}
      {stats?.length ? (
        <View
          style={[
            styles.statsRow,
            { top: -STAT_OVERLAP },
          ]}
        >
          {stats.slice(0, 3).map((s, i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                },
              ]}
            >
              <Text style={[styles.statValue, { color: s.valueColor ?? colors.text }]}>
                {s.value ?? '—'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: LuminaSpacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: LuminaFontFamily.nunitoBold,
    color: '#FFFFFF',
  },
  nameBlock: { flex: 1 },
  greeting: {
    fontSize: 12,
    fontFamily: LuminaFontFamily.dmSansRegular,
    color: 'rgba(255,255,255,0.80)',
    marginBottom: 2,
  },
  name: {
    ...LuminaTypography.h2,
    color: '#FFFFFF',
    fontFamily: LuminaFontFamily.nunitoBold,
  },
  notifBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: LuminaRadius.full,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F04438',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, color: '#FFFFFF', fontFamily: LuminaFontFamily.dmSansSemiBold },

  statsRow: {
    position: 'absolute',
    left: LuminaSpacing.xl,
    right: LuminaSpacing.xl,
    flexDirection: 'row',
    gap: LuminaSpacing.sm,
  },
  statCard: {
    flex: 1,
    height: STAT_CARD_HEIGHT,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.sm,
  },
  statValue: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
