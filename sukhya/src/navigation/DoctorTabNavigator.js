import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

// Screens
import DoctorDashboardScreen from '../screens/doctor/dashboard/DoctorDashboardScreen';
import DoctorAnalyticsScreen from '../screens/doctor/dashboard/DoctorAnalyticsScreen';
import DoctorAppointmentsScreen from '../screens/doctor/appointments/DoctorAppointmentsScreen';
import DoctorAppointmentDetailScreen from '../screens/doctor/appointments/DoctorAppointmentDetailScreen';
import RescheduleScreen from '../screens/doctor/appointments/RescheduleScreen';
import PatientListScreen from '../screens/doctor/patients/PatientListScreen';
import PatientDetailScreen from '../screens/doctor/patients/PatientDetailScreen';
import PatientHistoryScreen from '../screens/doctor/patients/PatientHistoryScreen';
import ClinicalScreen from '../screens/doctor/clinical/ClinicalScreen';
import CreateNoteScreen from '../screens/doctor/clinical/CreateNoteScreen';
import CreatePrescriptionScreen from '../screens/doctor/clinical/CreatePrescriptionScreen';
import CreateFollowUpScreen from '../screens/doctor/clinical/CreateFollowUpScreen';
import NoteDetailScreen from '../screens/doctor/clinical/NoteDetailScreen';
import DoctorProfileScreen from '../screens/doctor/profile/DoctorProfileScreen';
import EditDoctorProfileScreen from '../screens/doctor/profile/EditDoctorProfileScreen';
import AvailabilityScreen from '../screens/doctor/profile/AvailabilityScreen';
import LeaveManagementScreen from '../screens/doctor/profile/LeaveManagementScreen';
import SchedulingSettingsScreen from '../screens/doctor/profile/SchedulingSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Stack navigators per tab ────────────────────────────────────

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
      <Stack.Screen name="DoctorAnalytics" component={DoctorAnalyticsScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorAppointments" component={DoctorAppointmentsScreen} />
      <Stack.Screen name="DoctorAppointmentDetail" component={DoctorAppointmentDetailScreen} />
      <Stack.Screen name="Reschedule" component={RescheduleScreen} />
    </Stack.Navigator>
  );
}

function PatientsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientList" component={PatientListScreen} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
      <Stack.Screen name="PatientHistory" component={PatientHistoryScreen} />
    </Stack.Navigator>
  );
}

function ClinicalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Clinical" component={ClinicalScreen} />
      <Stack.Screen name="CreateNote" component={CreateNoteScreen} />
      <Stack.Screen name="CreatePrescription" component={CreatePrescriptionScreen} />
      <Stack.Screen name="CreateFollowUp" component={CreateFollowUpScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
      <Stack.Screen name="EditDoctorProfile" component={EditDoctorProfileScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="LeaveManagement" component={LeaveManagementScreen} />
      <Stack.Screen name="SchedulingSettings" component={SchedulingSettingsScreen} />
    </Stack.Navigator>
  );
}

// ─── Tab Navigator ───────────────────────────────────────────────

export default function DoctorTabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'DMSans_400Regular',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            DashboardTab:    focused ? 'grid'          : 'grid-outline',
            AppointmentsTab: focused ? 'calendar'      : 'calendar-outline',
            PatientsTab:     focused ? 'people'        : 'people-outline',
            ClinicalTab:     focused ? 'clipboard'     : 'clipboard-outline',
            ProfileTab:      focused ? 'person'        : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab"    component={DashboardStack}    options={{ title: 'Dashboard' }} />
      <Tab.Screen name="AppointmentsTab" component={AppointmentsStack} options={{ title: 'Appointments' }} />
      <Tab.Screen name="PatientsTab"     component={PatientsStack}     options={{ title: 'Patients' }} />
      <Tab.Screen name="ClinicalTab"     component={ClinicalStack}     options={{ title: 'Notes / Rx' }} />
      <Tab.Screen name="ProfileTab"      component={ProfileStack}      options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}