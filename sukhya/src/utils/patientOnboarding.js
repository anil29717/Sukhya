import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'patient_onboarding_done';

export async function markOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function isOnboardingCompleteCached() {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function clearOnboardingCache() {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}
