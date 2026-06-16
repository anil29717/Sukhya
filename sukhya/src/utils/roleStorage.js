import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ROLE_KEY = 'user_role';

export const getUserRole = async () => {
  try {
    return await AsyncStorage.getItem(USER_ROLE_KEY);
  } catch {
    return null;
  }
};

export const saveUserRole = async (role) => {
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
};
