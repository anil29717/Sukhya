import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { store } from '@/store/store';
import { tokenStorage, ACCESS_TOKEN_KEY, ACTIVE_PATIENT_KEY } from '@/api/storage';
import { client } from '@/api/client';
import { setAuth, setActivePatient, clearAuth } from '@/store/authSlice';
import { normalizeUser, UserResponse, PatientResponse } from '@/api/types';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        const token = await tokenStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          client.defaults.headers.common.Authorization = `Bearer ${token}`;
          const userRes = await client.get<UserResponse>('/users/me');
          const user = normalizeUser(userRes.data);
          let patient: PatientResponse | null = null;
          if (user.role === 'patient') {
            const pRes = await client.get<PatientResponse>('/patients/me');
            patient = pRes.data;
            const savedPatientId = await tokenStorage.getItem(ACTIVE_PATIENT_KEY);
            if (savedPatientId && patient) {
              const pid = parseInt(savedPatientId, 10);
              if (pid !== patient.id) {
                dispatch(setActivePatient({ patientId: pid, displayName: 'Family Member' }));
              }
            }
          }
          dispatch(setAuth({ user, token, patient }));
        }
      } catch {
        await tokenStorage.removeItem(ACCESS_TOKEN_KEY);
        dispatch(clearAuth());
      } finally {
        setReady(true);
      }
    }
    initSession();
  }, [dispatch]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppInitializer>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(patient)" />
              <Stack.Screen name="(doctor)" />
              <Stack.Screen name="(auth)" />
            </Stack>
          </AppInitializer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}
