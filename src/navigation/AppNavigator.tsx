import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import AuthGateScreen from '@/features/auth/screens/AuthGateScreen';
import ProfileSetupScreen from '@/features/profile/screens/ProfileSetupScreen';
import AddressSelectScreen from '@/features/profile/screens/AddressSelectScreen';
import SavedAddressesScreen from '@/features/profile/screens/SavedAddressesScreen';
import ScheduleFormScreen from '@/features/schedule/screens/ScheduleFormScreen';
import ScheduleAdminScreen from '@/features/schedule/screens/ScheduleAdminScreen';
import ChangeRequestScreen from '@/features/schedule/screens/ChangeRequestScreen';
import TripOperationsScreen from '@/features/schedule/screens/TripOperationsScreen';
import { colors } from '@/theme/colors';
import HomeTabs from '@/navigation/HomeTabs';

export type RootStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  ProfileSetup: { pickedAddress?: { formattedAddress: string; latitude: number; longitude: number } } | undefined;
  AddressSelect: { initialAddress?: string; latitude?: number | null; longitude?: number | null } | undefined;
  SavedAddresses: undefined;
  ScheduleForm: undefined;
  ScheduleAdmin: undefined;
  ChangeRequest: { weekStartISO: string; day: import('@/features/schedule/types').DayKey; current?: { time?: string; addressId?: string; addressName?: string } };
  TripOperations: { weekStartISO: string; day: import('@/features/schedule/types').DayKey; scheduledTime?: string; addressName?: string };
  HomeTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AuthGate"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="AuthGate" component={AuthGateScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="AddressSelect" component={AddressSelectScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="ScheduleForm" component={ScheduleFormScreen} />
      <Stack.Screen name="ScheduleAdmin" component={ScheduleAdminScreen} />
      <Stack.Screen name="ChangeRequest" component={ChangeRequestScreen} />
      <Stack.Screen name="TripOperations" component={TripOperationsScreen} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
    </Stack.Navigator>
  );
}


