import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

export default function AuthGateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  React.useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (user) => {
      if (!user) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      try {
        const doc = await firestore().collection('users').doc(user.uid).get();
        const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : (doc as any).exists;
        const data = exists ? (doc.data() as { isAdmin?: boolean; profileCompleted?: boolean }) : {};
        if (data?.isAdmin) {
          navigation.reset({ index: 0, routes: [{ name: 'ScheduleAdmin' }] });
          return;
        }
        if (data?.profileCompleted) {
          navigation.reset({ index: 0, routes: [{ name: 'ScheduleForm' }] });
          return;
        }
        navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
      } catch {
        navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
      }
    });
    return unsub;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});


