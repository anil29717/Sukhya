import { Tabs, useRouter, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DoctorBottomNav, DoctorTabKey } from '@/components/lumina/DoctorBottomNav';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const TAB_ROUTES: Record<DoctorTabKey, string> = {
  dashboard: '/(doctor)/(tabs)',
  appointments: '/(doctor)/(tabs)/appointments',
  patients: '/(doctor)/(tabs)/patients',
  schedule: '/(doctor)/(tabs)/schedule',
  profile: '/(doctor)/(tabs)/profile',
};

function tabFromSegment(segment: string): DoctorTabKey {
  if (segment === 'appointments') return 'appointments';
  if (segment === 'patients') return 'patients';
  if (segment === 'schedule') return 'schedule';
  if (segment === 'profile') return 'profile';
  return 'dashboard';
}

export default function DoctorTabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const last = segments[segments.length - 1] as string;
  const active = tabFromSegment(last === '(tabs)' || last === 'index' ? 'index' : last);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="appointments" />
        <Tabs.Screen name="patients" />
        <Tabs.Screen name="schedule" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <DoctorBottomNav active={active} onTabPress={(tab) => router.replace(TAB_ROUTES[tab] as never)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
