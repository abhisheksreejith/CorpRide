import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import AuthGateScreen from '@/features/auth/screens/AuthGateScreen';
import ProfileSetupScreen from '@/features/profile/screens/ProfileSetupScreen';
import AddressSelectScreen from '@/features/profile/screens/AddressSelectScreen';
import SavedAddressesScreen from '@/features/profile/screens/SavedAddressesScreen';
import ScheduleFormScreen from '@/features/schedule/screens/ScheduleFormScreen';
import ScheduleAdminScreen from '@/features/schedule/screens/ScheduleAdminScreen';
import { colors } from '@/theme/colors';

export type RootStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  ProfileSetup: { pickedAddress?: { formattedAddress: string; latitude: number; longitude: number } } | undefined;
  AddressSelect: { initialAddress?: string; latitude?: number | null; longitude?: number | null } | undefined;
  SavedAddresses: undefined;
  ScheduleForm: undefined;
  ScheduleAdmin: undefined;
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
    </Stack.Navigator>
  );
}


