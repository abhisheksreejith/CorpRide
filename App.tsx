import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '@/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import toastConfig from '@/components/ui/Toast';
import * as ExpoNotifications from 'expo-notifications';

export default function App() {
  React.useEffect(() => {
    // Ensure foreground notifications are displayed as alerts
    ExpoNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator />
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
}
