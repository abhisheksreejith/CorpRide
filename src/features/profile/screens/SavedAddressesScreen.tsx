import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppButton from '@/components/ui/AppButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useSavedAddressesViewModel } from '@/features/profile/viewmodels/useSavedAddressesViewModel';

export default function SavedAddressesScreen() {
  const { items, loading, remove } = useSavedAddressesViewModel();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Addresses</Text>
        <AppButton title="Add new" onPress={() => navigation.navigate('AddressSelect')} />
      </View>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name ?? 'Unnamed'}</Text>
              <Text style={styles.cardSub}>{item.formattedAddress}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <AppButton variant="secondary" title="Remove" onPress={() => remove(item.id)} />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, paddingHorizontal: 16 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.textPrimary, fontWeight: '700' },
  cardSub: { color: colors.textSecondary, marginTop: 4 },
});


