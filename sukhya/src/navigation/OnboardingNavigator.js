import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding1BasicInfo from '../screens/patient/onboarding/Onboarding1BasicInfo';
import Onboarding2MedicalInfo from '../screens/patient/onboarding/Onboarding2MedicalInfo';
import Onboarding3Family from '../screens/patient/onboarding/Onboarding3Family';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding1"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding1" component={Onboarding1BasicInfo} />
      <Stack.Screen name="Onboarding2" component={Onboarding2MedicalInfo} />
      <Stack.Screen name="Onboarding3" component={Onboarding3Family} />
    </Stack.Navigator>
  );
}
