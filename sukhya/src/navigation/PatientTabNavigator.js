import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Home
import HomeScreen from '../screens/patient/home/HomeScreen';
import DoctorListingScreen from '../screens/patient/home/DoctorListingScreen';
import DoctorDetailScreen from '../screens/patient/home/DoctorDetailScreen';
import AppointmentBookingScreen from '../screens/patient/home/AppointmentBookingScreen';
import BookingConfirmationScreen from '../screens/patient/home/BookingConfirmationScreen';
import NotificationCenterScreen from '../screens/patient/home/NotificationCenterScreen';

// Appointments
import PatientAppointmentsScreen from '../screens/patient/appointments/PatientAppointmentsScreen';
import PatientAppointmentDetailScreen from '../screens/patient/appointments/PatientAppointmentDetailScreen';
import PatientRescheduleScreen from '../screens/patient/appointments/PatientRescheduleScreen';
import QuickRebookScreen from '../screens/patient/appointments/QuickRebookScreen';

// Records
import RecordsScreen from '../screens/patient/records/RecordsScreen';
import UploadRecordScreen from '../screens/patient/records/UploadRecordScreen';
import RecordDetailScreen from '../screens/patient/records/RecordDetailScreen';
import PrescriptionDetailScreen from '../screens/patient/records/PrescriptionDetailScreen';
import DigitalLockerScreen from '../screens/patient/records/DigitalLockerScreen';
import LockerAccessLogScreen from '../screens/patient/records/LockerAccessLogScreen';

// Health
import HealthScreen from '../screens/patient/health/HealthScreen';
import HealthTimelineScreen from '../screens/patient/health/HealthTimelineScreen';
import LogVitalScreen from '../screens/patient/health/LogVitalScreen';
import VitalTrendsScreen from '../screens/patient/health/VitalTrendsScreen';
import MedicationsScreen from '../screens/patient/health/MedicationsScreen';
import AddMedicationScreen from '../screens/patient/health/AddMedicationScreen';
import DoseLogScreen from '../screens/patient/health/DoseLogScreen';

// Profile
import PatientProfileScreen from '../screens/patient/profile/PatientProfileScreen';
import EditPatientProfileScreen from '../screens/patient/profile/EditPatientProfileScreen';
import EditMedicalInfoScreen from '../screens/patient/profile/EditMedicalInfoScreen';
import FamilyScreen from '../screens/patient/profile/FamilyScreen';
import AddFamilyMemberScreen from '../screens/patient/profile/AddFamilyMemberScreen';
import FamilyMemberDetailScreen from '../screens/patient/profile/FamilyMemberDetailScreen';
import EmergencyCardScreen from '../screens/patient/profile/EmergencyCardScreen';
import AppSettingsScreen from '../screens/patient/profile/AppSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="DoctorListing" component={DoctorListingScreen} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientAppointments" component={PatientAppointmentsScreen} />
      <Stack.Screen name="PatientAppointmentDetail" component={PatientAppointmentDetailScreen} />
      <Stack.Screen name="PatientReschedule" component={PatientRescheduleScreen} />
      <Stack.Screen name="QuickRebook" component={QuickRebookScreen} />
    </Stack.Navigator>
  );
}

function RecordsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Records" component={RecordsScreen} />
      <Stack.Screen name="UploadRecord" component={UploadRecordScreen} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
      <Stack.Screen name="DigitalLocker" component={DigitalLockerScreen} />
      <Stack.Screen name="LockerAccessLog" component={LockerAccessLogScreen} />
    </Stack.Navigator>
  );
}

function HealthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Health" component={HealthScreen} />
      <Stack.Screen name="HealthTimeline" component={HealthTimelineScreen} />
      <Stack.Screen name="LogVital" component={LogVitalScreen} />
      <Stack.Screen name="VitalTrends" component={VitalTrendsScreen} />
      <Stack.Screen name="Medications" component={MedicationsScreen} />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
      <Stack.Screen name="DoseLog" component={DoseLogScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientProfile" component={PatientProfileScreen} />
      <Stack.Screen name="EditPatientProfile" component={EditPatientProfileScreen} />
      <Stack.Screen name="EditMedicalInfo" component={EditMedicalInfoScreen} />
      <Stack.Screen name="Family" component={FamilyScreen} />
      <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
      <Stack.Screen name="FamilyMemberDetail" component={FamilyMemberDetailScreen} />
      <Stack.Screen name="EmergencyCard" component={EmergencyCardScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
    </Stack.Navigator>
  );
}

export default function PatientTabNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1D27' : '#FFFFFF',
          borderTopColor: isDark ? '#2C3142' : '#E9ECEF',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#F05A2A',
        tabBarInactiveTintColor: '#868E96',
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'DMSans_400Regular',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            HomeTab:         focused ? 'home'     : 'home-outline',
            AppointmentsTab: focused ? 'calendar' : 'calendar-outline',
            RecordsTab:      focused ? 'folder'   : 'folder-outline',
            HealthTab:       focused ? 'heart'    : 'heart-outline',
            ProfileTab:      focused ? 'person'   : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"         component={HomeStack}         options={{ title: 'Home' }} />
      <Tab.Screen name="AppointmentsTab" component={AppointmentsStack} options={{ title: 'Appointments' }} />
      <Tab.Screen name="RecordsTab"      component={RecordsStack}      options={{ title: 'Records' }} />
      <Tab.Screen name="HealthTab"       component={HealthStack}       options={{ title: 'Health' }} />
      <Tab.Screen name="ProfileTab"      component={ProfileStack}      options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
