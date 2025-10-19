import React from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, RefreshControl, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppButton from '@/components/ui/AppButton';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { DayKey, WeekSchedule, TripDocument } from '@/features/schedule/types';
import { getDateForWeekDay, isAtLeastNDaysAway } from '@/features/schedule/types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type ScheduleDoc = {
  uid: string;
  weekStartISO: string;
  schedule: WeekSchedule;
  status: 'submitted' | 'approved' | 'rejected' | 'draft';
  createdAt: number;
};

type PickupItem = { id: string; weekStartISO: string; day: DayKey; time: string; addressName?: string };
type CompletedItem = { id: string; day: DayKey; weekStartISO: string; time?: string | undefined; addressName?: string | undefined; endTime?: number | undefined };

const DAYS: DayKey[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function ScheduleListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = React.useState<PickupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [tab, setTab] = React.useState<'next' | 'completed'>('next');
  const [completed, setCompleted] = React.useState<CompletedItem[]>([]);
  const { width } = useWindowDimensions();
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const pagerRef = React.useRef<any>(null);

  const buildItems = React.useCallback((docs: FirebaseFirestoreTypes.QuerySnapshot) => {
    const list: PickupItem[] = [];
    docs.forEach((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      const data = d.data() as ScheduleDoc;
      DAYS.forEach((day) => {
        const p = data.schedule[day]?.pickup;
        if (p?.time && (p.addressName || p.addressId)) {
          list.push({
            id: `${d.id}_${day}`,
            weekStartISO: data.weekStartISO,
            day,
            time: p.time,
            ...(p.addressName ? { addressName: p.addressName } : {}),
          });
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

  // Subscribe to completed trips for this user
  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore()
      .collection('trips')
      .where('uid', '==', user.uid)
      .where('status', '==', 'completed') as FirebaseFirestoreTypes.Query<TripDocument> as any;
    const unsub = ref.onSnapshot((snap: FirebaseFirestoreTypes.QuerySnapshot) => {
      const data: CompletedItem[] = [];
      snap.forEach((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const t = d.data() as TripDocument;
        data.push({ id: d.id, day: t.day, weekStartISO: t.weekStartISO, time: t.scheduledTime, addressName: t.addressName, endTime: t.endTime });
      });
      // Sort by endTime desc
      data.sort((a, b) => (b.endTime ?? 0) - (a.endTime ?? 0));
      setCompleted(data);
    });
    return unsub;
  }, []);

  // Refresh when screen refocuses
  useFocusEffect(
    React.useCallback(() => {
      const user = auth().currentUser;
      if (!user) return;
      let mounted = true;
      (async () => {
        try {
          const snap = await firestore().collection('schedules').where('uid', '==', user.uid).orderBy('createdAt', 'desc').get({
            source: 'server',
          });
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
    console.log('user', user);
    if (!user) return;
    setRefreshing(true);
    try {
      const snap = await firestore().collection('schedules').where('uid', '==', user.uid).orderBy('createdAt', 'desc').get({
        source: 'server',
      });
      console.log('snap', snap.docs.length);
      buildItems(snap as any);
    }catch(e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [buildItems]);

  // Helpers to compute target datetime for an item
  const getItemDateTime = (it: PickupItem) => {
    const d = getDateForWeekDay(it.weekStartISO, it.day);
    const [hh, mm] = (it.time || '00:00').split(':').map((x) => parseInt(x, 10));
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d.getTime();
  };

  const nowTs = Date.now();
  const nextData = React.useMemo(() => items.filter((it) => getItemDateTime(it) >= nowTs).sort((a, b) => getItemDateTime(a) - getItemDateTime(b)), [items]);

  const sections = React.useMemo(() => {
    const todayRef = new Date();
    todayRef.setHours(0, 0, 0, 0);
    const isSameYMD = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const todayItems = nextData.filter((it) => {
      const d = getDateForWeekDay(it.weekStartISO, it.day);
      return isSameYMD(d, todayRef);
    });
    const upcomingItems = nextData.filter((it) => {
      const d = getDateForWeekDay(it.weekStartISO, it.day);
      return !isSameYMD(d, todayRef);
    });
    const arr: { title: string; data: PickupItem[] }[] = [];
    if (todayItems.length > 0) arr.push({ title: 'Today', data: todayItems });
    if (upcomingItems.length > 0) arr.push({ title: 'Upcoming', data: upcomingItems });
    return arr;
  }, [nextData]);

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled Pickups</Text>
        <AppButton title="Plan next week" onPress={() => navigation.navigate('ScheduleForm')} />
      </View>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => { setTab('next'); pagerRef.current?.scrollTo({ x: 0, animated: true } as any); }}
          style={styles.tabBtnFlat}
        >
          <Text style={[styles.tabTextFlat, tab === 'next' && styles.tabTextFlatActive]}>Active Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setTab('completed'); pagerRef.current?.scrollTo({ x: width, animated: true } as any); }}
          style={styles.tabBtnFlat}
        >
          <Text style={[styles.tabTextFlat, tab === 'completed' && styles.tabTextFlatActive]}>Completed</Text>
        </TouchableOpacity>
        <Animated.View
          pointerEvents="none"
          style={[styles.tabIndicator, {
            width: (width - 32) / 2 * 0.6,
            transform: [{ translateX: scrollX.interpolate({
              inputRange: [0, width],
              outputRange: [16 + ((width - 32) / 2 - ((width - 32) / 2 * 0.6)) / 2, 16 + (width - 32) / 2 + ((width - 32) / 2 - ((width - 32) / 2 * 0.6)) / 2],
            }) }],
          }]}
        />
      </View>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setTab(idx === 0 ? 'next' : 'completed');
          }}
        >
          <View style={{ width }}>
            <SectionList
              sections={sections}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10, flexGrow: 1 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.cardTitle}>{item.day} • {item.time}</Text>
                    {(() => {
                      const targetDate = getDateForWeekDay(item.weekStartISO, item.day);
                      const canRequest = isAtLeastNDaysAway(targetDate, 7);
                      if (!canRequest) return null;
                      return (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('ChangeRequest', { weekStartISO: item.weekStartISO, day: item.day, current: { time: item.time, ...(item.addressName ? { addressName: item.addressName } : {}) } })}
                          style={{ padding: 6, borderRadius: 14 }}
                        >
                          <Ionicons name="pencil-outline" size={18} color={colors.textPrimary} />
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                  <Text style={styles.cardSub}>{item.addressName ?? '—'}</Text>
                  <Text style={styles.cardMeta}>Week of {item.weekStartISO}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('TripOperations', { weekStartISO: item.weekStartISO, day: item.day, scheduledTime: item.time, ...(item.addressName ? { addressName: item.addressName } : {}) })}
                      style={styles.smallBtn}
                    >
                      <Text style={styles.smallBtnText}>Ride Actions</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Image source={require('@/assets/images/no-data.png')} style={styles.emptyImage} resizeMode="contain" />
                  <Text style={styles.emptyText}>No schedule data found</Text>
                </View>
              }
            />
          </View>
          <View style={{ width }}>
            <FlatList
              data={completed}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10, flexGrow: 1 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.day} • {item.time ?? '—'}</Text>
                  <Text style={styles.cardSub}>{item.addressName ?? '—'}</Text>
                  <Text style={styles.cardMeta}>Ended: {item.endTime ? new Date(item.endTime).toLocaleString() : '—'}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Image source={require('@/assets/images/no-data.png')} style={styles.emptyImage} resizeMode="contain" />
                  <Text style={styles.emptyText}>No completed trips</Text>
                </View>
              }
            />
          </View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, paddingHorizontal: 16 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8, alignItems: 'flex-end' },
  tabBtnFlat: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  tabTextFlat: { color: colors.textSecondary, fontWeight: '700' },
  tabTextFlatActive: { color: colors.accent },
  tabIndicator: { position: 'absolute', height: 3, backgroundColor: colors.accent, bottom: 0, borderRadius: 2 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.textPrimary, fontWeight: '700' },
  cardSub: { color: colors.textSecondary, marginTop: 4 },
  cardMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyImage: { width: '100%', height: undefined, aspectRatio: 3/2, opacity: 0.9 },
  emptyText: { color: colors.textSecondary },
  smallBtn: { paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  smallBtnText: { color: '#1C1C1C', fontWeight: '600' },
  sectionTitle: { color: colors.textPrimary, fontWeight: '700', paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
});


