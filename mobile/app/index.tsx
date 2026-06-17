import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState } from '@/store/store';
import { LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function LuminaSplashScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        if (user.role === 'patient') {
          router.replace('/(patient)/(tabs)');
        } else if (user.role === 'doctor') {
          router.replace('/(doctor)/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  return (
    <LinearGradient
      colors={[colors.wellnessGradientStart, colors.wellnessGradientEnd]}
      style={styles.container}
    >
      <Text style={styles.logo}>Lumina Health</Text>
      <Text style={styles.tagline}>Premium healthcare at your fingertips</Text>
      <ActivityIndicator size="large" color={colors.accentTeal} style={styles.loader} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { ...LuminaTypography.h1, color: '#FFFFFF', fontSize: 32, marginBottom: 8 },
  tagline: { ...LuminaTypography.body, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  loader: { marginTop: 40 },
});
