import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

import { LuminaFontFamily, LuminaRadius, LuminaSpacing, LuminaTypography, LuminaLayout } from '@/theme/lumina';

export type AuthPalette = {
  bg: readonly [string, string, string];
  orb1: string;
  orb2: string;
  orb3: string;
  logo: readonly [string, string, string];
  logoGlow: string;
  logoRing: string;
  accent: string;
};

export const AUTH_PALETTES = {
  patient: {
    bg: ['#FFF8F5', '#F8F9FA', '#FEF0EB'] as const,
    orb1: '#F05A2A',
    orb2: '#FF8A65',
    orb3: '#0D9B76',
    logo: ['#FF7A4D', '#F05A2A', '#D94A1A'] as const,
    logoGlow: '#F05A2A',
    logoRing: 'rgba(240,90,42,0.25)',
    accent: '#F05A2A',
  },
  doctor: {
    bg: ['#EEF9F5', '#F8F9FA', '#E3F2FD'] as const,
    orb1: '#0D9B76',
    orb2: '#34C759',
    orb3: '#0BA5EC',
    logo: ['#12B886', '#0D9B76', '#087A5C'] as const,
    logoGlow: '#0D9B76',
    logoRing: 'rgba(13,155,118,0.28)',
    accent: '#0D9B76',
  },
  welcome: {
    bg: ['#EEF9F5', '#F8F9FA', '#FFF5F0'] as const,
    orb1: '#0D9B76',
    orb2: '#F05A2A',
    orb3: '#0BA5EC',
    logo: ['#12B886', '#0D9B76', '#087A5C'] as const,
    logoGlow: '#0D9B76',
    logoRing: 'rgba(13,155,118,0.22)',
    accent: '#0D9B76',
  },
  reset: {
    bg: ['#EEF9F5', '#F8F9FA', '#E8F4FD'] as const,
    orb1: '#0D9B76',
    orb2: '#34C759',
    orb3: '#F05A2A',
    logo: ['#12B886', '#0D9B76', '#087A5C'] as const,
    logoGlow: '#0D9B76',
    logoRing: 'rgba(13,155,118,0.28)',
    accent: '#0D9B76',
  },
} as const satisfies Record<string, AuthPalette>;

export function AuthBackground({ palette }: { palette: AuthPalette }) {
  return (
    <>
      <LinearGradient colors={[...palette.bg]} style={StyleSheet.absoluteFill} />
      <GlassOrb size={220} color={palette.orb1} style={{ top: -40, right: -60 }} delay={0} />
      <GlassOrb size={160} color={palette.orb2} style={{ top: 120, left: -50 }} delay={400} />
      <GlassOrb size={120} color={palette.orb3} style={{ bottom: 80, right: -20 }} delay={800} />
    </>
  );
}

export function AuthMeshRings({ accent, topPercent = 0.18 }: { accent: string; topPercent?: number }) {
  return (
    <>
      <View
        style={[styles.mesh, { top: `${topPercent * 100}%`, borderColor: `${accent}12` }]}
        pointerEvents="none"
      />
      <View
        style={[styles.meshInner, { top: `${(topPercent + 0.04) * 100}%`, borderColor: `${accent}18` }]}
        pointerEvents="none"
      />
    </>
  );
}

export function GlassOrb({
  size,
  color,
  style,
  delay = 0,
}: {
  size: number;
  color: string;
  style?: ViewStyle;
  delay?: number;
}) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(10, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
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
          backgroundColor: color,
          opacity: 0.22,
        },
        style,
        animStyle,
      ]}
    />
  );
}

export function GlassBackButton({ onPress }: { onPress: () => void }) {
  if (Platform.OS === 'android') {
    return (
      <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <View style={[styles.backBtn, styles.androidBackBtn]}>
          <Ionicons name="chevron-back" size={22} color="#212529" />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
      <View style={styles.backShadow}>
        <BlurView intensity={55} tint="light" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#212529" />
        </BlurView>
      </View>
    </Pressable>
  );
}

function InputFieldContent({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  accent,
  focused,
  onFocus,
  onBlur,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences';
  accent: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <>
      <View style={[styles.inputIconWrap, { backgroundColor: focused ? `${accent}18` : 'rgba(0,0,0,0.04)' }]}>
        <Ionicons name={icon} size={17} color={focused ? accent : '#868E96'} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#ADB5BD"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {trailing}
    </>
  );
}

export function GlassInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  accent,
  trailing,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences';
  accent: string;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.inputGroup, LuminaLayout.fullWidth]}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          style={[
            styles.inputWrap,
            styles.androidSurface,
            LuminaLayout.fullWidth,
            { borderColor: focused ? accent : '#DEE2E6' },
          ]}
        >
          <InputFieldContent
            icon={icon}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            accent={accent}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            trailing={trailing}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.inputGroup, LuminaLayout.fullWidth]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputShadow, LuminaLayout.fullWidth, focused && { shadowColor: accent, shadowOpacity: 0.18 }]}>
        <BlurView
          intensity={42}
          tint="light"
          style={StyleSheet.flatten([
            styles.inputWrap,
            LuminaLayout.fullWidth,
            {
              borderColor: focused ? accent : 'rgba(255,255,255,0.85)',
              backgroundColor: 'rgba(255,255,255,0.45)',
            },
          ])}
        >
          <InputFieldContent
            icon={icon}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            accent={accent}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            trailing={trailing}
          />
        </BlurView>
      </View>
    </View>
  );
}

export function GlossyCard({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.glassCard, styles.androidCard, LuminaLayout.fullWidth]}>
        <View style={[styles.cardAccentLine, { backgroundColor: accent }]} pointerEvents="none" />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.cardShadow, LuminaLayout.fullWidth]}>
      <BlurView intensity={72} tint="light" style={[styles.glassCard, LuminaLayout.fullWidth]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardGloss}
          pointerEvents="none"
        />
        <View style={[styles.cardAccentLine, { backgroundColor: accent }]} pointerEvents="none" />
        {children}
      </BlurView>
    </View>
  );
}

export function AuthLogoMark({
  palette,
  animatedScale,
  compact,
}: {
  palette: AuthPalette;
  animatedScale?: SharedValue<number>;
  compact?: boolean;
}) {
  const fallbackScale = useSharedValue(1);
  const scale = animatedScale ?? fallbackScale;
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <View style={[styles.logoWrap, compact && styles.logoWrapCompact]}>
        <View style={[styles.logoGlow, { shadowColor: palette.logoGlow }]} />
        <View style={[styles.logoRing, { borderColor: palette.logoRing }]}>
          <LinearGradient colors={[...palette.logo]} style={styles.logoGradient}>
            <Text style={styles.logoLetter}>L</Text>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
}

export function AuthBadge({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${accent}14`, borderColor: `${accent}30` }]}>
      <View style={[styles.badgeDot, { backgroundColor: accent }]} />
      <Text style={[styles.badgeText, { color: accent }]}>{label}</Text>
    </View>
  );
}

export function AuthTextLink({
  label,
  accent,
  onPress,
}: {
  label: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.textLink} accessibilityRole="button">
      <Text style={[styles.textLinkLabel, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

export function GlassPrimaryButton({
  label,
  onPress,
  gradient,
  glowColor,
}: {
  label: string;
  onPress: () => void;
  gradient: readonly [string, string];
  glowColor: string;
}) {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [LuminaLayout.fullWidth, { opacity: pressed ? 0.92 : 1 }]}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryBtn, styles.androidPrimaryBtn, LuminaLayout.fullWidth]}
        >
          <Text style={styles.primaryBtnText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtnShadow,
        LuminaLayout.fullWidth,
        { shadowColor: glowColor, opacity: pressed ? 0.9 : 1 },
      ]}
      accessibilityRole="button"
    >
      <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primaryBtn, LuminaLayout.fullWidth]}>
        <Text style={styles.primaryBtnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GlassOutlineButton({
  label,
  onPress,
  accent,
}: {
  label: string;
  onPress: () => void;
  accent: string;
}) {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.outlineBtn,
          styles.androidSurface,
          LuminaLayout.fullWidth,
          { borderColor: `${accent}55`, opacity: pressed ? 0.92 : 1 },
        ]}
        accessibilityRole="button"
      >
        <Text style={[styles.outlineBtnText, { color: accent }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.outlineBtnShadow, LuminaLayout.fullWidth]} accessibilityRole="button">
      <BlurView
        intensity={48}
        tint="light"
        style={StyleSheet.flatten([
          styles.outlineBtn,
          LuminaLayout.fullWidth,
          {
            borderColor: `${accent}55`,
            backgroundColor: 'rgba(255,255,255,0.42)',
          },
        ])}
      >
        <Text style={[styles.outlineBtnText, { color: accent }]}>{label}</Text>
      </BlurView>
    </Pressable>
  );
}

export const authChromeStyles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: LuminaSpacing.xl,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  scrollTop: {
    flexGrow: 1,
    paddingHorizontal: LuminaSpacing.xl,
    alignItems: 'stretch',
  },
  header: { alignItems: 'center', marginBottom: 26 },
  wordmark: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.dmSansMedium,
    color: '#868E96',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heading: {
    fontSize: 28,
    fontFamily: LuminaFontFamily.nunitoExtraBold,
    letterSpacing: -0.5,
    color: '#212529',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    ...LuminaTypography.body,
    color: '#495057',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.xs,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.lg,
    marginBottom: LuminaSpacing.lg,
    backgroundColor: 'rgba(254,226,226,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { ...LuminaTypography.bodySmall, flex: 1 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LuminaSpacing.sm,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.lg,
    marginBottom: LuminaSpacing.lg,
    backgroundColor: 'rgba(209,250,229,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(13,155,118,0.2)',
  },
  successText: {
    ...LuminaTypography.bodySmall,
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansMedium,
    color: '#065F46',
  },
  secureNote: {
    marginTop: LuminaSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  secureNoteText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: LuminaFontFamily.dmSansRegular,
    color: '#868E96',
    lineHeight: 16,
  },
});

const styles = StyleSheet.create({
  mesh: {
    position: 'absolute',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
  },
  meshInner: {
    position: 'absolute',
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  backShadow: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: LuminaSpacing.lg,
    alignSelf: 'flex-start',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  androidBackBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9ECEF',
    elevation: 3,
    marginBottom: LuminaSpacing.lg,
    alignSelf: 'flex-start',
  },
  androidSurface: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  androidCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EEF0F2',
    elevation: 6,
  },
  androidPrimaryBtn: {
    elevation: 4,
  },
  logoWrap: { marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  logoWrapCompact: { marginBottom: 0 },
  logoGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  logoRing: {
    padding: 4,
    borderRadius: 44,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 30,
    fontFamily: LuminaFontFamily.nunitoExtraBold,
    color: '#FFFFFF',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: {
    fontSize: 11,
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardShadow: {
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 14,
  },
  glassCard: {
    borderRadius: 28,
    padding: LuminaSpacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  cardGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
  },
  cardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 3,
    borderRadius: 2,
    opacity: 0.85,
  },
  inputGroup: { marginBottom: LuminaSpacing.lg },
  inputLabel: {
    fontSize: 12,
    fontFamily: LuminaFontFamily.dmSansMedium,
    color: '#495057',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputShadow: {
    borderRadius: LuminaRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
    minHeight: 54,
  },
  inputIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: LuminaFontFamily.dmSansRegular,
    color: '#212529',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  textLink: { alignItems: 'center', marginTop: LuminaSpacing.lg, paddingVertical: 8 },
  textLinkLabel: { fontSize: 14, fontFamily: LuminaFontFamily.dmSansSemiBold },
  primaryBtnShadow: {
    borderRadius: LuminaRadius.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtn: {
    height: 54,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  outlineBtnShadow: {
    borderRadius: LuminaRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  outlineBtn: {
    height: 54,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outlineBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
  },
});
