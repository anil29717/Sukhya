import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class TokenStorage {
  private memoryStore: Record<string, string> = {};

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        this.memoryStore[key] = value;
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return this.memoryStore[key] ?? null;
      }
    }
    return AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        delete this.memoryStore[key];
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
}

export const tokenStorage = new TokenStorage();
export const ACCESS_TOKEN_KEY = 'lumina_access_token';
export const REFRESH_TOKEN_KEY = 'lumina_refresh_token';
export const REMEMBER_ME_KEY = 'lumina_remember_me';
export const DISMISSED_NOTIFICATIONS_KEY = 'lumina_dismissed_notifications';
export const ACTIVE_PATIENT_KEY = 'lumina_active_patient_id';

export async function getDismissedNotificationIds(): Promise<number[]> {
  const raw = await tokenStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

export async function dismissNotificationId(id: number): Promise<void> {
  const ids = await getDismissedNotificationIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await tokenStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(ids));
  }
}
