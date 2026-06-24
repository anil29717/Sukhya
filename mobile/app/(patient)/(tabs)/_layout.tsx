import { Tabs, useRouter, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { BottomNav, TabKey } from '@/components/lumina/BottomNav';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const TAB_ROUTES: Record<TabKey, string> = {
  home: '/(patient)/(tabs)',
  doctors: '/(patient)/(tabs)/doctors',
  records: '/(patient)/(tabs)/records',
  timeline: '/(patient)/(tabs)/timeline',
  profile: '/(patient)/(tabs)/profile',
};

function tabFromSegment(segment: string): TabKey {
  if (segment === 'doctors') return 'doctors';
  if (segment === 'records') return 'records';
  if (segment === 'timeline') return 'timeline';
  if (segment === 'profile') return 'profile';
  return 'home';
}

export default function PatientTabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const last = segments[segments.length - 1] as string;
  const active = tabFromSegment(last === '(tabs)' || last === 'index' ? 'index' : last);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="doctors" />
        <Tabs.Screen name="records" />
        <Tabs.Screen name="timeline" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <BottomNav active={active} onTabPress={(tab) => router.replace(TAB_ROUTES[tab] as never)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
