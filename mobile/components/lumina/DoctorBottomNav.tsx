import { GlassTabBar } from '@/components/lumina/GlassTabBar';

export type DoctorTabKey = 'dashboard' | 'appointments' | 'patients' | 'schedule' | 'profile';

const TABS = [
  { key: 'dashboard' as DoctorTabKey, label: 'Dashboard', icon: 'grid-outline' as const, iconActive: 'grid' as const },
  { key: 'appointments' as DoctorTabKey, label: 'Appts', icon: 'calendar-outline' as const, iconActive: 'calendar' as const },
  { key: 'patients' as DoctorTabKey, label: 'Patients', icon: 'people-outline' as const, iconActive: 'people' as const },
  { key: 'schedule' as DoctorTabKey, label: 'Schedule', icon: 'time-outline' as const, iconActive: 'time' as const },
  { key: 'profile' as DoctorTabKey, label: 'Profile', icon: 'person-outline' as const, iconActive: 'person' as const },
];

type DoctorBottomNavProps = {
  active: DoctorTabKey;
  onTabPress: (tab: DoctorTabKey) => void;
};

export function DoctorBottomNav({ active, onTabPress }: DoctorBottomNavProps) {
  return (
    <GlassTabBar
      tabs={TABS}
      active={active}
      onTabPress={onTabPress}
      role="doctor"
    />
  );
}
