import { GlassTabBar } from '@/components/lumina/GlassTabBar';

export type TabKey = 'home' | 'doctors' | 'records' | 'timeline' | 'profile';

const TABS = [
  { key: 'home' as TabKey, label: 'Home', icon: 'home-outline' as const, iconActive: 'home' as const },
  { key: 'doctors' as TabKey, label: 'Doctors', icon: 'medical-outline' as const, iconActive: 'medical' as const },
  { key: 'records' as TabKey, label: 'Records', icon: 'folder-outline' as const, iconActive: 'folder' as const },
  { key: 'timeline' as TabKey, label: 'Timeline', icon: 'time-outline' as const, iconActive: 'time' as const },
  { key: 'profile' as TabKey, label: 'Profile', icon: 'person-outline' as const, iconActive: 'person' as const },
];

type BottomNavProps = {
  active: TabKey;
  onTabPress: (tab: TabKey) => void;
};

export function BottomNav({ active, onTabPress }: BottomNavProps) {
  return (
    <GlassTabBar
      tabs={TABS}
      active={active}
      onTabPress={onTabPress}
      role="patient"
    />
  );
}
