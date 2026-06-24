import { useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RootState } from '@/store/store';
import { LuminaFontFamily, LuminaRadius, LuminaSpacing } from '@/theme/lumina';

const { width } = Dimensions.get('window');
const HERO_SIZE = Math.min(width * 0.78, 300);

export default function LuminaSplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  const blockOpacity = useSharedValue(0);
  const blockY = useSharedValue(14);
  const logoScale = useSharedValue(0.86);
  const ringScale = useSharedValue(1);
  const taglineOpacity = useSharedValue(0);

  const ease = Easing.out(Easing.cubic);

  useEffect(() => {
    logoScale.value = withDelay(80, withTiming(1, { duration: 560, easing: ease }));
    blockOpacity.value = withDelay(120, withTiming(1, { duration: 520, easing: ease }));
    blockY.value = withDelay(120, withTiming(0, { duration: 520, easing: ease }));
    taglineOpacity.value = withDelay(420, withTiming(1, { duration: 480, easing: ease }));
    ringScale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [blockOpacity, blockY, logoScale, ringScale, taglineOpacity, ease]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        if (user.role === 'patient') {
          router.replace('/(patient)/(tabs)');
        } else if (user.role === 'doctor') {
          router.replace('/(doctor)/(tabs)');
        } else {
          router.replace('/(auth)/welcome');
        }
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  const blockStyle = useAnimatedStyle(() => ({
    opacity: blockOpacity.value,
    transform: [{ translateY: blockY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0D9B76', '#076B52']} style={StyleSheet.absoluteFill} />

      {/* Ambient light wash */}
      <LinearGradient
        colors={['rgba(255,255,255,0.14)', 'transparent', 'rgba(0,0,0,0.08)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SplashOrb size={240} style={{ top: -70, right: -80 }} delay={0} />
      <SplashOrb size={180} style={{ bottom: 60, left: -60 }} delay={500} />
      <SplashOrb size={120} style={{ top: '22%', left: -30 }} delay={900} />

      <View style={styles.center}>
        <View style={[styles.heroArea, { width: HERO_SIZE, height: HERO_SIZE }]}>
          <View style={[styles.ring, { width: HERO_SIZE, height: HERO_SIZE, borderColor: 'rgba(255,255,255,0.06)' }]} />
          <View
            style={[
              styles.ring,
              { width: HERO_SIZE * 0.82, height: HERO_SIZE * 0.82, borderColor: 'rgba(255,255,255,0.10)' },
            ]}
          />
          <View
            style={[
              styles.ring,
              { width: HERO_SIZE * 0.64, height: HERO_SIZE * 0.64, borderColor: 'rgba(255,255,255,0.16)' },
            ]}
          />
          <Animated.View style={[styles.ringPulseWrap, ringStyle]}>
            <View
              style={[
                styles.ring,
                { width: HERO_SIZE * 0.46, height: HERO_SIZE * 0.46, borderColor: 'rgba(255,255,255,0.28)' },
              ]}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.content, blockStyle]}>
          <Animated.View style={[styles.logoShadow, logoAnimStyle]}>
            <View style={styles.logoOuterRing}>
              <GlassLogoShell />
            </View>
          </Animated.View>

          <Text style={styles.wordmark}>Lumina Health</Text>

          <Animated.View style={taglineStyle}>
            <GlassTagline text="Premium healthcare at your fingertips" />
          </Animated.View>
        </Animated.View>
      </View>

      <GlassLoader />
    </View>
  );
}

function GlassLogoShell() {
  const shimmerX = useSharedValue(-80);

  useEffect(() => {
    shimmerX.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(120, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(-80, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: '18deg' }],
  }));

  const Wrap = Platform.OS === 'ios' ? BlurView : View;

  return (
    <Wrap
      intensity={Platform.OS === 'ios' ? 36 : undefined}
      tint="light"
      style={StyleSheet.flatten([
        styles.logoGlass,
        Platform.OS === 'android' ? { backgroundColor: 'rgba(255,255,255,0.22)' } : null,
      ])}
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)', 'transparent']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.logoGloss}
        pointerEvents="none"
      />
      <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.logoInner}>
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.12)']}
          style={styles.logoInnerGradient}
        >
          <Text style={styles.logoLetter}>L</Text>
        </LinearGradient>
      </View>
    </Wrap>
  );
}

function GlassTagline({ text }: { text: string }) {
  const Wrap = Platform.OS === 'ios' ? BlurView : View;
  return (
    <Wrap
      intensity={Platform.OS === 'ios' ? 28 : undefined}
      tint="light"
      style={StyleSheet.flatten([
        styles.taglinePill,
        Platform.OS === 'android' ? { backgroundColor: 'rgba(255,255,255,0.16)' } : null,
      ])}
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
    >
      <Text style={styles.tagline}>{text}</Text>
    </Wrap>
  );
}

function GlassLoader() {
  const Wrap = Platform.OS === 'ios' ? BlurView : View;
  return (
    <View style={styles.loaderWrap}>
      <Wrap
        intensity={Platform.OS === 'ios' ? 32 : undefined}
        tint="light"
        style={StyleSheet.flatten([
          styles.loaderPill,
          Platform.OS === 'android' ? { backgroundColor: 'rgba(255,255,255,0.14)' } : null,
        ])}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      >
        {[0, 1, 2].map((i) => (
          <PulseDot key={i} delay={i * 180} active={i === 1} />
        ))}
      </Wrap>
    </View>
  );
}

function SplashOrb({
  size,
  style,
  delay,
}: {
  size: number;
  style?: object;
  delay: number;
}) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, floatY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        style,
        animStyle,
      ]}
    />
  );
}

function PulseDot({ delay, active }: { delay: number; active?: boolean }) {
  const opacity = useSharedValue(active ? 1 : 0.35);
  const scale = useSharedValue(active ? 1.15 : 1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 450 }),
          withTiming(0.35, { duration: 450 }),
        ),
        -1,
        false,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 450 }),
          withTiming(1, { duration: 450 }),
        ),
        -1,
        false,
      ),
    );
  }, [opacity, scale, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, active && styles.dotActive, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.xl,
  },
  heroArea: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  ringPulseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 22,
  },
  logoOuterRing: {
    padding: 5,
    borderRadius: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoGlass: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  logoGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 36,
    opacity: 0.9,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoInnerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 34,
    fontFamily: LuminaFontFamily.nunitoExtraBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  wordmark: {
    fontSize: 30,
    fontFamily: LuminaFontFamily.nunitoExtraBold,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: LuminaSpacing.md,
  },
  taglinePill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  tagline: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmSansMedium,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
  loaderWrap: {
    position: 'absolute',
    bottom: 54,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  loaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
