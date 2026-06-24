import { useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {
  AUTH_PALETTES,
  AuthBackground,
  AuthBadge,
  AuthLogoMark,
  GlassOutlineButton,
  GlassPrimaryButton,
  authChromeStyles,
  type AuthPalette,
} from '@/components/lumina/AuthChrome';
import { LuminaFontFamily, LuminaSpacing, LuminaLayout } from '@/theme/lumina';

const { width } = Dimensions.get('window');
const HERO_SIZE = Math.min(width * 0.72, 280);

function WelcomeHero({
  palette,
  coral,
  logoScale,
}: {
  palette: AuthPalette;
  coral: string;
  logoScale: SharedValue<number>;
}) {
  const accent = palette.accent;
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2800 }),
        withTiming(1, { duration: 2800 }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={[styles.heroWrap, { width: HERO_SIZE, height: HERO_SIZE }]}>
      <View style={[styles.ring, { width: HERO_SIZE, height: HERO_SIZE, borderColor: `${accent}10` }]} />
      <View
        style={[
          styles.ring,
          { width: HERO_SIZE * 0.82, height: HERO_SIZE * 0.82, borderColor: `${accent}1A` },
        ]}
      />
      <View
        style={[
          styles.ring,
          { width: HERO_SIZE * 0.64, height: HERO_SIZE * 0.64, borderColor: `${accent}30` },
        ]}
      />
      <Animated.View style={[styles.heroCenter, pulseStyle]}>
        <View
          style={[
            styles.ring,
            { width: HERO_SIZE * 0.48, height: HERO_SIZE * 0.48, borderColor: `${accent}45` },
          ]}
        />
        <AuthLogoMark palette={palette} animatedScale={logoScale} compact />
      </Animated.View>
      <View style={[styles.dot, styles.dot1, { backgroundColor: `${accent}55` }]} />
      <View style={[styles.dot, styles.dot2, { backgroundColor: `${coral}44` }]} />
      <View style={[styles.dot, styles.dot3, { backgroundColor: `${accent}33` }]} />
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = AUTH_PALETTES.welcome;
  const accent = palette.accent;
  const coral = AUTH_PALETTES.patient.accent;

  const blockOpacity = useSharedValue(0);
  const blockY = useSharedValue(24);
  const logoScale = useSharedValue(0.88);

  const ease = Easing.out(Easing.cubic);

  useEffect(() => {
    logoScale.value = withDelay(80, withTiming(1, { duration: 520, easing: ease }));
    blockOpacity.value = withDelay(120, withTiming(1, { duration: 480, easing: ease }));
    blockY.value = withDelay(120, withTiming(0, { duration: 480, easing: ease }));
  }, [blockOpacity, blockY, logoScale, ease]);

  const blockStyle = useAnimatedStyle(() => ({
    opacity: blockOpacity.value,
    transform: [{ translateY: blockY.value }],
  }));

  return (
    <View style={authChromeStyles.root}>
      <AuthBackground palette={palette} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + LuminaSpacing.lg,
            paddingBottom: insets.bottom + LuminaSpacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.mainBlock, blockStyle]}>
          <WelcomeHero palette={palette} coral={coral} logoScale={logoScale} />

          <View style={styles.copyBlock}>
            <AuthBadge label="Premium Healthcare" accent={accent} />
            <Text style={authChromeStyles.wordmark}>Lumina Health</Text>
            <Text style={styles.heading}>Healthcare that{'\n'}knows you</Text>
            <Text style={styles.subtitle}>
              Appointments, prescriptions, and health records all in one beautiful place.
            </Text>
          </View>

          <View style={styles.buttons}>
            <GlassPrimaryButton
              label="Continue as Doctor"
              onPress={() => router.push('/(auth)/doctor-login')}
              gradient={['#12B886', '#0D9B76']}
              glowColor="#0D9B76"
            />
            <GlassOutlineButton
              label="I'm a Patient"
              onPress={() => router.push('/(auth)/login')}
              accent={coral}
            />
            <Text style={styles.footerNote}>
              Secure · Private · Built for modern care teams
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.xl,
    minHeight: '100%',
    alignItems: 'stretch',
  },
  mainBlock: {
    alignItems: 'center',
    width: '100%',
    gap: LuminaSpacing.xl,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LuminaSpacing.xs,
  },
  heroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  dot: { position: 'absolute', borderRadius: 9999 },
  dot1: { width: 8, height: 8, top: '8%', left: '6%' },
  dot2: { width: 6, height: 6, top: '18%', right: '4%' },
  dot3: { width: 10, height: 10, bottom: '12%', left: '10%' },

  copyBlock: {
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  heading: {
    fontSize: 30,
    fontFamily: LuminaFontFamily.nunitoExtraBold,
    letterSpacing: -0.5,
    color: '#212529',
    marginTop: LuminaSpacing.sm,
    marginBottom: LuminaSpacing.sm,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    ...authChromeStyles.subtitle,
    maxWidth: 320,
    marginTop: 2,
  },
  buttons: {
    width: '100%',
    gap: LuminaSpacing.md,
    marginTop: LuminaSpacing.sm,
  },
  footerNote: {
    marginTop: LuminaSpacing.xs,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: LuminaFontFamily.dmSansRegular,
    color: '#868E96',
    letterSpacing: 0.2,
  },
});
