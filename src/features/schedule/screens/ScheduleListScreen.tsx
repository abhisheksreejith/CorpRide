import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppButton from '@/components/ui/AppButton';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { DayKey, WeekSchedule } from '@/features/schedule/types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type ScheduleDoc = {
  uid: string;
  weekStartISO: string;
  schedule: WeekSchedule;
  status: 'submitted' | 'approved' | 'rejected' | 'draft';
  createdAt: number;
};

type PickupItem = { id: string; weekStartISO: string; day: DayKey; time: string; addressName?: string };

const DAYS: DayKey[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function ScheduleListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = React.useState<PickupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const buildItems = React.useCallback((docs: FirebaseFirestoreTypes.QuerySnapshot) => {
    const list: PickupItem[] = [];
    docs.forEach((d) => {
      const data = d.data() as ScheduleDoc;
      DAYS.forEach((day) => {
        const p = data.schedule[day]?.pickup;
        if (p?.time && (p.addressName || p.addressId)) {
          list.push({ id: `${d.id}_${day}`, weekStartISO: data.weekStartISO, day, time: p.time, addressName: p.addressName });
        }
      });
    });
    setItems(list);
  }, []);

  // Live updates
  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore().collection('schedules').where('uid', '==', user.uid).orderBy('createdAt', 'desc');
    const unsub = ref.onSnapshot((snap) => { buildItems(snap); setLoading(false); }, () => setLoading(false));
    return unsub;
  }, [buildItems]);

  // Refresh when screen refocuses
  useFocusEffect(
    React.useCallback(() => {
      const user = auth().currentUser;
      if (!user) return;
      let mounted = true;
      (async () => {
        try {
          const snap = await firestore().collection('schedules').where('uid', '==', user.uid).orderBy('createdAt', 'desc').get();
          if (mounted) buildItems(snap as any);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }, [buildItems])
  );

  const onRefresh = React.useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    setRefreshing(true);
    try {
      const snap = await firestore().collection('schedules').where('uid', '==', user.uid).orderBy('createdAt', 'desc').get();
      buildItems(snap as any);
    } finally {
      setRefreshing(false);
    }
  }, [buildItems]);

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled Pickups</Text>
        <AppButton title="Plan next week" onPress={() => navigation.navigate('ScheduleForm')} />
      </View>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.day} • {item.time}</Text>
              <Text style={styles.cardSub}>{item.addressName ?? '—'}</Text>
              <Text style={styles.cardMeta}>Week of {item.weekStartISO}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Image source={require('@/assets/images/no-data.png')} style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyText}>No schedule data found</Text>
            </View>
          }
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
  cardMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyImage: { width: '100%', height: undefined, aspectRatio: 3/2, opacity: 0.9 },
  emptyText: { color: colors.textSecondary },
});


