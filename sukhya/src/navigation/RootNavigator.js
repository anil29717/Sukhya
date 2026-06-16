import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { setAuth, clearAuth, setSavedRole, setLoading } from '../store/authSlice';
import { getAccessToken, clearTokens } from '../api/client';
import { getMeApi } from '../api/auth';
import { getMyDoctorProfile } from '../api/doctors';
import { getTokenRole } from '../utils/jwt';
import { getUserRole } from '../utils/roleStorage';

import SplashScreen, { SPLASH_MIN_DURATION_MS } from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import DoctorPendingScreen from '../screens/auth/DoctorPendingScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, role, isApproved, savedRole } = useSelector((s) => s.auth);
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
          dispatch(clearAuth());
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
          }

          dispatch(setAuth({
            role,
            user: enrichedUser,
            isApproved: user.is_approved ?? false,
          }));
        } catch {
          await clearTokens();
          dispatch(clearAuth());
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
