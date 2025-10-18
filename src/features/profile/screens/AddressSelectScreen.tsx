import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AddressPicker from '@/features/profile/components/AddressPicker';
import AppButton from '@/components/ui/AppButton';
import AppTextField from '@/components/ui/AppTextField';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type RouteParams = {
  initialAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export default function AddressSelectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = (route.params as any) as RouteParams | undefined;
  const [selected, setSelected] = React.useState<{ formattedAddress: string; latitude: number; longitude: number } | undefined>(
    params?.initialAddress && params?.latitude != null && params?.longitude != null
      ? { formattedAddress: params.initialAddress, latitude: params.latitude as number, longitude: params.longitude as number }
      : undefined
  );
  const [name, setName] = React.useState('');

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.content}>
        <AddressPicker
          initialText={params?.initialAddress}
          latitude={params?.latitude}
          longitude={params?.longitude}
          onChange={(val) => setSelected(val)}
        />
      </View>
      <View style={styles.footer}>
        <AppTextField placeholder="Name (e.g., Home, School)" value={name} onChangeText={setName} leftIconName="pricetag-outline" />
        <AppButton
          title="Use this address"
          onPress={() => {
            if (!selected) return;
            navigation.navigate('ProfileSetup', { pickedAddress: { ...selected, name } as any });
          }}
          disabled={!selected}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 16 },
  footer: { padding: 16 },
});


