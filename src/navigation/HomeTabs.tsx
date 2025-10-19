import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ScheduleFormScreen from '@/features/schedule/screens/ScheduleFormScreen';
import ScheduleListScreen from '@/features/schedule/screens/ScheduleListScreen';
import ProfileOverviewScreen from '../features/profile/screens/ProfileOverviewScreen';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';

export type HomeTabParamList = {
  Schedule: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

export default function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border,  },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          const name = route.name === 'Schedule' ? 'calendar-outline' : 'person-circle-outline';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Schedule" component={ScheduleListScreen} />
      <Tab.Screen name="Profile" component={ProfileOverviewScreen} />
    </Tab.Navigator>
  );
}


