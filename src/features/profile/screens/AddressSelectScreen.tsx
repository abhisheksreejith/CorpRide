import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AddressPicker from '@/features/profile/components/AddressPicker';
import AppButton from '@/components/ui/AppButton';
import AppTextField from '@/components/ui/AppTextField';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

type RouteParams = {
  initialAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export default function AddressSelectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const params = (route.params as any) as RouteParams | undefined;
  const [selected, setSelected] = React.useState<{ formattedAddress: string; latitude: number; longitude: number } | undefined>(
    params?.initialAddress && params?.latitude != null && params?.longitude != null
      ? { formattedAddress: params.initialAddress, latitude: params.latitude as number, longitude: params.longitude as number }
      : undefined
  );
  const [name, setName] = React.useState('');

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom  : 0}>
      <View style={styles.content}>
        <AddressPicker
          initialText={params?.initialAddress}
          latitude={params?.latitude}
          longitude={params?.longitude}
          onChange={(val) => setSelected(val)}
          fullHeight
        />
      </View>
      <View style={styles.footer}>
        <AppTextField placeholder="Name (e.g., Home, School)" value={name} onChangeText={setName} leftIconName="pricetag-outline" />
        <AppButton
          title="Use this address"
          onPress={() => {
            if (!selected || !name.trim()) return;
            const user = auth().currentUser;
            if (!user) return;
            const doc = {
              name: name.trim(),
              formattedAddress: selected.formattedAddress,
              latitude: selected.latitude,
              longitude: selected.longitude,
              createdAt: Date.now(),
            };
            firestore().collection('users').doc(user.uid).collection('addresses').add(doc).finally(() => {
              navigation.goBack();
            });
          }}
          disabled={!selected || !name.trim()}
          style={{ width: '100%' }}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { position: 'absolute', left: 12, right: 12, zIndex: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  content: { flex: 1, padding: 16 },
  footer: { paddingHorizontal: 16 , gap: 12},
});


