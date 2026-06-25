import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { saveUserRole } from '../../utils/roleStorage';
import { setSavedRole } from '../../store/authSlice';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

const { width, height } = Dimensions.get('window');

// ─── Geometric illustration ───────────────────────────────────────
// Abstract teal circles/arcs — no stock art, no emoji
function GeometricIllustration({ colors }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.illustrationContainer}>
      {/* Outermost ring — very faint */}
      <View style={[styles.ring, styles.ring4, { borderColor: colors.teal + '12' }]} />
      {/* Second ring */}
      <View style={[styles.ring, styles.ring3, { borderColor: colors.teal + '20' }]} />
      {/* Third ring */}
      <View style={[styles.ring, styles.ring2, { borderColor: colors.teal + '35' }]} />

      {/* Animated inner group */}
      <Animated.View style={{ transform: [{ scale: pulse }], alignItems: 'center', justifyContent: 'center' }}>
        {/* Core circle */}
        <View style={[styles.ring, styles.ring1, { borderColor: colors.teal + '60' }]} />

        {/* Center filled circle */}
        <View style={[styles.centerCircle, { backgroundColor: colors.tealLight }]}>
          {/* S mark inside */}
          <View style={[styles.innerMark, { backgroundColor: colors.teal }]}>
            <Text style={[styles.innerMarkText, { color: '#FFFFFF' }]}>S</Text>
          </View>
        </View>
      </Animated.View>

      {/* Floating accent dots */}
      <View style={[styles.accentDot, styles.dot1, { backgroundColor: colors.teal + '60' }]} />
      <View style={[styles.accentDot, styles.dot2, { backgroundColor: colors.coral + '50' }]} />
      <View style={[styles.accentDot, styles.dot3, { backgroundColor: colors.teal + '40' }]} />
      <View style={[styles.accentDot, styles.dot4, { backgroundColor: colors.teal + '30' }]} />

      {/* Arc lines — decorative */}
      <View style={[styles.arcLine, styles.arc1, { borderColor: colors.teal + '25' }]} />
      <View style={[styles.arcLine, styles.arc2, { borderColor: colors.teal + '15' }]} />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function WelcomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  const handleContinueAsDoctor = async () => {
    await saveUserRole('doctor');
    dispatch(setSavedRole('doctor'));
    navigation.navigate('Login');
  };

  const handleContinueAsPatient = async () => {
    await saveUserRole('patient');
    dispatch(setSavedRole('patient'));
  };

  // Entrance animations
  const contentOpacity   = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(24)).current;
  const btnOpacity       = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Illustration — top 52% */}
      <View style={styles.illustrationWrapper}>
        <GeometricIllustration colors={colors} />
      </View>

      {/* Content — bottom 48% */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          },
        ]}
      >
        {/* Small logo wordmark */}
        <View style={styles.logoRow}>
          <View style={[styles.logoSmallMark, { backgroundColor: colors.teal }]}>
            <Text style={styles.logoSmallText}>S</Text>
          </View>
          <Text style={[styles.logoWordmark, { color: colors.teal }]}>Sukhya</Text>
        </View>

        {/* Heading */}
        <Text style={[styles.heading, { color: colors.textPrimary }]}>
          Healthcare that{'\n'}knows you
        </Text>

        {/* Subtext */}
        <Text style={[styles.subtext, { color: colors.textSecondary }]}>
          Manage appointments, patients, and prescriptions — all in one place.
        </Text>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, { opacity: btnOpacity }]}>
        {/* Primary — Doctor */}
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: colors.coral }]}
          onPress={handleContinueAsDoctor}
          activeOpacity={0.88}
        >
          <Text style={styles.btnPrimaryText}>Continue as Doctor</Text>
        </TouchableOpacity>

        {/* Secondary — Patient (placeholder for now) */}
        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: colors.teal }]}
          onPress={handleContinueAsPatient}
          activeOpacity={0.88}
        >
          <Text style={[styles.btnSecondaryText, { color: colors.teal }]}>
            I'm a Patient
          </Text>
        </TouchableOpacity>

        {/* Sign in link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
          style={styles.signInRow}
        >
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Text style={[styles.signInLink, { color: colors.teal }]}>Sign in</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  // ── Illustration ──
  illustrationWrapper: {
    height: height * 0.46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    width: width,
    height: height * 0.46,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Rings
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  ring4: { width: 340, height: 340 },
  ring3: { width: 280, height: 280 },
  ring2: { width: 220, height: 220 },
  ring1: { width: 160, height: 160 },

  centerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMarkText: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 26,
  },

  // Accent dots
  accentDot: {
    position: 'absolute',
    borderRadius: 9999,
  },
  dot1: { width: 10, height: 10, top: height * 0.05,  left:  width * 0.18 },
  dot2: { width: 7,  height: 7,  top: height * 0.08,  right: width * 0.16 },
  dot3: { width: 12, height: 12, bottom: height * 0.04, left: width * 0.25 },
  dot4: { width: 6,  height: 6,  bottom: height * 0.06, right: width * 0.22 },

  // Arc lines
  arcLine: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
  },
  arc1: {
    transform: [{ rotate: '45deg' }],
    top: height * 0.01,
    right: -30,
  },
  arc2: {
    transform: [{ rotate: '-30deg' }],
    bottom: height * 0.01,
    left: -40,
  },

  // ── Content ──
  content: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
    gap: 8,
  },
  logoSmallMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSmallText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  logoWordmark: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.md,
  },
  heading: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 28,
    lineHeight: 36,
    marginBottom: Spacing[2],
  },
  subtext: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
    lineHeight: 24,
    maxWidth: 320,
  },

  // ── Buttons ──
  buttons: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  btnPrimary: {
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.md,
    color: '#FFFFFF',
  },
  btnSecondary: {
    height: 54,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.md,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[1],
  },
  signInText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  signInLink: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
  },
});