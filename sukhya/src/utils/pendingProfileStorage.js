import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_PROFILE_KEY = 'pending_doctor_profile';

export const savePendingProfile = async (profile) => {
  await AsyncStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profile));
};

export const getPendingProfile = async () => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingProfile = async () => {
  await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
};
