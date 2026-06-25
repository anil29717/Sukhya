import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PatientLoginScreen from '../screens/patient/auth/PatientLoginScreen';
import PatientRegisterScreen from '../screens/patient/auth/PatientRegisterScreen';
import PatientForgotPasswordScreen from '../screens/patient/auth/PatientForgotPasswordScreen';
import PatientResetPasswordScreen from '../screens/patient/auth/PatientResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function PatientAuthNavigator({ initialRouteName = 'PatientLogin' }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
      <Stack.Screen name="PatientRegister" component={PatientRegisterScreen} />
      <Stack.Screen name="PatientForgotPassword" component={PatientForgotPasswordScreen} />
      <Stack.Screen name="PatientResetPassword" component={PatientResetPasswordScreen} />
    </Stack.Navigator>
  );
}
