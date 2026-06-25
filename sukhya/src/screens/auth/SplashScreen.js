import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, FontSize } from '../../theme/typography';

export const SPLASH_MIN_DURATION_MS = 2000;

export default function SplashScreen() {
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoTranslate  = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslate, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });

    const pulseDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();

    pulseDot(dot1, 0);
    pulseDot(dot2, 200);
    pulseDot(dot3, 400);

  }, []);

  return (
    <LinearGradient
      colors={['#0D9B76', '#076B52']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="light" />

      {/* Center: Logo + Tagline */}
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoGroup,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslate }],
            },
          ]}
        >
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>S</Text>
          </View>
          <Text style={styles.wordmark}>Sukhya</Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Your health, simply taken care of.
        </Animated.Text>
      </View>

      {/* Pulsing dots */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>

      {/* Made in India — split into 3 Text nodes to avoid emoji rendering bug */}
      <View style={styles.madeInRow}>
        <Text style={styles.madeIn}>Made with </Text>
        <Text style={styles.heart}>{'\u2665'}</Text>
        <Text style={styles.madeIn}> in India</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  logoGroup: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoMarkText: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 36,
    color: '#FFFFFF',
    lineHeight: 42,
  },
  wordmark: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 38,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 46,
  },
  tagline: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 52,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  madeInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
  },
  madeIn: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.50)',
  },
  heart: {
    fontSize: FontSize.xs,
    color: '#FF8A8A',
    lineHeight: 16,
  },
});