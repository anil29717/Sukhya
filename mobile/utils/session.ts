import { router } from 'expo-router';

import { logout as logoutApi } from '@/api/auth';
import { client } from '@/api/client';
import { tokenStorage, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ACTIVE_PATIENT_KEY } from '@/api/storage';
import { clearAuth } from '@/store/authSlice';
import { store } from '@/store/store';

/** Shared sign-out — same behavior for patient & doctor (UX-only navigation fix). */
export async function performLogout(): Promise<void> {
  const refresh = await tokenStorage.getItem(REFRESH_TOKEN_KEY);
  if (refresh) {
    try {
      await logoutApi(refresh);
    } catch {
      // ignore
    }
  }
  await tokenStorage.removeItem(ACCESS_TOKEN_KEY);
  await tokenStorage.removeItem(REFRESH_TOKEN_KEY);
  await tokenStorage.removeItem(ACTIVE_PATIENT_KEY);
  delete client.defaults.headers.common.Authorization;
  store.dispatch(clearAuth());
  router.replace('/(auth)/welcome');
}
