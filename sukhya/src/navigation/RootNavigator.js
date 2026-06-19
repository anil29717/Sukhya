import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { setAuth, clearAuth, setSavedRole, setLoading } from '../store/authSlice';
import { setPatientOnboardingComplete } from '../store/settingsSlice';
import { getAccessToken, clearTokens } from '../api/client';
import { getMeApi } from '../api/auth';
import { getMyDoctorProfile } from '../api/doctors';
import { getMyPatientProfile } from '../api/patients';
import { getTokenRole } from '../utils/jwt';
import { getUserRole } from '../utils/roleStorage';
import {
  isOnboardingCompleteCached,
  markOnboardingComplete,
  clearOnboardingCache,
} from '../utils/patientOnboarding';

import SplashScreen, { SPLASH_MIN_DURATION_MS } from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import PatientAuthNavigator from './PatientAuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import PatientTabNavigator from './PatientTabNavigator';
import DoctorPendingScreen from '../screens/auth/DoctorPendingScreen';

const Stack = createNativeStackNavigator();

async function resolvePatientOnboarding() {
  const cached = await isOnboardingCompleteCached();
  if (cached) return true;

  try {
    const profile = await getMyPatientProfile();
    const complete = !!profile.date_of_birth;
    if (complete) {
      await markOnboardingComplete();
    }
    return complete;
  } catch {
    return false;
  }
}

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, role, isApproved, savedRole } = useSelector((s) => s.auth);
  const { patientOnboardingComplete } = useSelector((s) => s.settings);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      dispatch(setLoading(true));

      try {
        const storedRole = await getUserRole();
        if (mounted) dispatch(setSavedRole(storedRole));

        const token = await getAccessToken();
        if (!token) {
          await clearOnboardingCache();
          dispatch(clearAuth());
          dispatch(setPatientOnboardingComplete(false));
          return;
        }

        try {
          const user = await getMeApi();
          const role = getTokenRole(token);
          let enrichedUser = user;

          if (role === 'doctor') {
            try {
              const doctorProfile = await getMyDoctorProfile();
              enrichedUser = { ...user, doctor_profile: doctorProfile };
            } catch {
              // Profile may not exist yet
            }
            if (mounted) dispatch(setPatientOnboardingComplete(false));
          }

          if (role === 'patient') {
            const onboardingComplete = await resolvePatientOnboarding();
            if (mounted) dispatch(setPatientOnboardingComplete(onboardingComplete));
          }

          dispatch(setAuth({
            role,
            user: enrichedUser,
            isApproved: user.is_approved ?? false,
          }));
        } catch {
          await clearTokens();
          await clearOnboardingCache();
          dispatch(clearAuth());
          dispatch(setPatientOnboardingComplete(false));
        }
      } finally {
        if (mounted) dispatch(setLoading(false));
      }
    };

    const minSplashDelay = new Promise((resolve) => {
      setTimeout(resolve, SPLASH_MIN_DURATION_MS);
    });

    Promise.all([bootstrap(), minSplashDelay]).finally(() => {
      if (mounted) setAppReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  if (!appReady) {
    return <SplashScreen />;
  }

  const getAuthInitialRoute = () => {
    if (savedRole === 'doctor') return 'Login';
    return 'Welcome';
  };

  const renderNavigator = () => {
    if (!isAuthenticated) {
      if (savedRole === 'patient') {
        return (
          <Stack.Screen name="PatientAuth">
            {() => (
              <PatientAuthNavigator
                key="patient"
                initialRouteName="PatientLogin"
              />
            )}
          </Stack.Screen>
        );
      }

      return (
        <Stack.Screen name="Auth">
          {() => (
            <AuthNavigator
              key={savedRole ?? 'none'}
              initialRouteName={getAuthInitialRoute()}
            />
          )}
        </Stack.Screen>
      );
    }

    if (role === 'doctor' && !isApproved) {
      return (
        <Stack.Screen name="DoctorPending" component={DoctorPendingScreen} />
      );
    }

    if (role === 'doctor' && isApproved) {
      return (
        <Stack.Screen name="DoctorApp" component={DoctorTabNavigator} />
      );
    }

    if (role === 'patient' && !patientOnboardingComplete) {
      return (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      );
    }

    if (role === 'patient' && patientOnboardingComplete) {
      return (
        <Stack.Screen name="PatientApp" component={PatientTabNavigator} />
      );
    }

    return (
      <Stack.Screen name="Auth">
        {() => (
          <AuthNavigator
            key={savedRole ?? 'none'}
            initialRouteName={getAuthInitialRoute()}
          />
        )}
      </Stack.Screen>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {renderNavigator()}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
