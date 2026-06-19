import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { SuccessScreen } from '@/components/lumina/SuccessScreen';

export default function UploadSuccessScreen() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace('/(patient)/(tabs)/records'), 2500);
    return () => clearTimeout(t);
  }, [router]);
  return <SuccessScreen title="Record Uploaded!" message="Your medical record has been securely stored." icon="cloud-upload" />;
}
