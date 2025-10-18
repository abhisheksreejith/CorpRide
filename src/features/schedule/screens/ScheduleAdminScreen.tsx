import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppButton from '@/components/ui/AppButton';
import { useScheduleAdminViewModel } from '@/features/schedule/viewmodels/useScheduleAdminViewModel';

export default function ScheduleAdminScreen() {
  const { items, loading, updateStatus } = useScheduleAdminViewModel();

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <Text style={styles.title}>Weekly Schedules</Text>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => `${i.uid}_${i.weekStartISO}`}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>User: {item.uid}</Text>
              <Text style={styles.cardSub}>Week: {item.weekStartISO}</Text>
              <Text style={styles.cardSub}>Status: {item.status}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <AppButton title="Approve" onPress={() => updateStatus(`${item.uid}_${item.weekStartISO}`, 'approved')} />
                <AppButton variant="secondary" title="Reject" onPress={() => updateStatus(`${item.uid}_${item.weekStartISO}`, 'rejected')} />
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
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', padding: 16 },
  subtitle: { color: colors.textSecondary, paddingHorizontal: 16 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.textPrimary, fontWeight: '700' },
  cardSub: { color: colors.textSecondary, marginTop: 4 },
});


