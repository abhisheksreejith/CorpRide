import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '@/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import toastConfig from '@/components/ui/Toast';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator />
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
}
