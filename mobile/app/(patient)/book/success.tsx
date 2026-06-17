import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { SuccessScreen } from '@/components/lumina/SuccessScreen';

export default function BookSuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(patient)/appointments'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <SuccessScreen
      title="Appointment Booked!"
      message="Your appointment has been confirmed. Redirecting to your appointments..."
      icon="calendar"
    />
  );
}
