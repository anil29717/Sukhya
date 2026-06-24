/**
 * Booking success screen — premium coral hero + appointment summary card.
 */
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

function formatDisplayDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDisplayTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function BookSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { doctorName, date, time } = useLocalSearchParams<{
    appointmentId: string;
    doctorName: string;
    date: string;
    time: string;
  }>();

  // Animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [checkScale, cardOpacity, cardSlide, btnOpacity]);

  return (
    <View style={[styles.root, { backgroundColor: '#F05A2A' }]}>
      {/* Coral hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 48 }]}>
        {/* Checkmark ring */}
        <Animated.View style={[styles.checkRing, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={52} color="#F05A2A" />
        </Animated.View>

        <Text style={styles.heroTitle}>Appointment booked!</Text>
        <Text style={styles.heroSub}>You're all set. See you at your appointment.</Text>
      </View>

      {/* White bottom sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        {/* Summary card */}
        <Animated.View
          style={[
            styles.summaryCard,
            LuminaShadow.md,
            { backgroundColor: colors.surface },
            { opacity: cardOpacity, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <View style={[styles.cardAccent, { backgroundColor: colors.coral }]} />
          <View style={{ flex: 1, gap: 14 }}>
            <SummaryItem
              icon="person-circle-outline"
              label="Doctor"
              value={doctorName || '—'}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SummaryItem
              icon="calendar-outline"
              label="Date"
              value={formatDisplayDate(date || '')}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SummaryItem
              icon="time-outline"
              label="Time"
              value={formatDisplayTime(time || '')}
              colors={colors}
              mono
            />
          </View>
        </Animated.View>

        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
          <Ionicons name="notifications-outline" size={16} color={colors.teal} />
          <Text style={[styles.infoText, { color: colors.teal }]}>
            You'll receive a reminder before your appointment.
          </Text>
        </View>

        {/* Action buttons */}
        <Animated.View style={[styles.actions, { opacity: btnOpacity }]}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.coral }]}
            onPress={() => router.replace('/(patient)/appointments')}
          >
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>View Appointment</Text>
          </Pressable>

          <Pressable
            style={styles.ghostBtn}
            onPress={() => router.replace('/(patient)/(tabs)')}
          >
            <Text style={[styles.ghostBtnText, { color: colors.textSecondary }]}>Back to Home</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  colors,
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  mono?: boolean;
}) {
  return (
    <View style={itemStyles.row}>
      <View style={[itemStyles.iconWrap, { backgroundColor: colors.coralSoft }]}>
        <Ionicons name={icon} size={16} color={colors.coral} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[itemStyles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
        <Text style={[
          itemStyles.value,
          {
            color: colors.text,
            fontFamily: mono ? LuminaFontFamily.dmMonoMedium : LuminaFontFamily.dmSansMedium,
          },
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: LuminaRadius.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 10, letterSpacing: 0.6, marginBottom: 2 },
  value: { fontSize: 15 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    alignItems: 'center',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: 48,
    gap: 14,
  },
  checkRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  heroTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  sheet: {
    flex: 1,
    borderTopLeftRadius: LuminaRadius.xl + 4,
    borderTopRightRadius: LuminaRadius.xl + 4,
    padding: LuminaSpacing.xl,
    gap: LuminaSpacing.lg,
  },

  summaryCard: {
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 14,
  },
  cardAccent: { width: 4, borderRadius: 2 },
  divider: { height: 1 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  infoText: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },

  actions: { gap: LuminaSpacing.md },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: LuminaRadius.lg,
    gap: 8,
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  ghostBtn: { alignItems: 'center', paddingVertical: LuminaSpacing.sm },
  ghostBtnText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
});
