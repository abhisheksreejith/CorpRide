import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  RefreshControl,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { Animated } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import AppButton from "@/components/ui/AppButton";
import {
  getDateForWeekDay,
  isAtLeastNDaysAway,
} from "@/features/schedule/types";
import { useScheduleListViewModel } from "@/features/schedule/viewmodels/useScheduleListViewModel";
import type {
  PickupItem,
  CompletedItem,
} from "@/features/schedule/viewmodels/useScheduleListViewModel";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";

// Types are provided by viewmodel

// Days constant handled in viewmodel

export default function ScheduleListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const pagerRef = React.useRef<any>(null);
  const insets = useSafeAreaInsets();
  const { state, setTab, onRefresh, seedTodayForTest } =
    useScheduleListViewModel();
  const {
    loading,
    refreshing,
    tab,
    sections,
    upcoming,
    completed,
    rejectedData,
  } = state;
  const [showActions, setShowActions] = React.useState(false);
  const onSOS = React.useCallback(async () => {
    try {
      const scheme = Platform.OS === "ios" ? "telprompt:" : "tel:";
      await Linking.openURL(`${scheme}100`);
    } catch {
      try {
        Alert.alert("Unable to start call", "Please dial 100 manually.");
      } catch {}
    }
  }, []);

  // Data and handlers are provided by the viewmodel

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled Pickups</Text>
        <View style={{ width: 140 }} />
      </View>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => {
            setTab("next");
            pagerRef.current?.scrollTo({ x: 0, animated: true } as any);
          }}
          style={styles.tabBtnFlat}
        >
          <Text
            style={[
              styles.tabTextFlat,
              tab === "next" && styles.tabTextFlatActive,
            ]}
          >
            Active Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setTab("completed");
            pagerRef.current?.scrollTo({ x: width, animated: true } as any);
          }}
          style={styles.tabBtnFlat}
        >
          <Text
            style={[
              styles.tabTextFlat,
              tab === "completed" && styles.tabTextFlatActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setTab("rejected");
            pagerRef.current?.scrollTo({ x: width * 2, animated: true } as any);
          }}
          style={styles.tabBtnFlat}
        >
          <Text
            style={[
              styles.tabTextFlat,
              tab === "rejected" && styles.tabTextFlatActive,
            ]}
          >
            Rejected
          </Text>
        </TouchableOpacity>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabIndicator,
            {
              width: ((width - 32) / 3) * 0.6,
              transform: [
                {
                  translateX: scrollX.interpolate({
                    inputRange: [0, width, width * 2],
                    outputRange: [
                      16 + ((width - 32) / 3 - ((width - 32) / 3) * 0.6) / 2,
                      16 +
                        (width - 32) / 3 +
                        ((width - 32) / 3 - ((width - 32) / 3) * 0.6) / 2,
                      16 +
                        ((width - 32) / 3) * 2 +
                        ((width - 32) / 3 - ((width - 32) / 3) * 0.6) / 2,
                    ],
                  }),
                },
              ],
            },
          ]}
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
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setTab(idx === 0 ? "next" : idx === 1 ? "completed" : "rejected");
          }}
        >
          <View style={{ width }}>
            <SectionList
              sections={sections}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
                gap: 10,
                flexGrow: 1,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent}
                />
              }
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.cardTitle}>
                      {item.day} • {item.time}
                    </Text>
                    {(() => {
                      const targetDate = getDateForWeekDay(
                        item.weekStartISO,
                        item.day
                      );
                      const canRequest = isAtLeastNDaysAway(targetDate, 7);
                      if (!canRequest) return null;
                      return (
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("ChangeRequest", {
                              weekStartISO: item.weekStartISO,
                              day: item.day,
                              current: {
                                time: item.time,
                                ...(item.addressName
                                  ? { addressName: item.addressName }
                                  : {}),
                              },
                            })
                          }
                          style={{ padding: 6, borderRadius: 14 }}
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={18}
                            color={colors.textPrimary}
                          />
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                  <Text style={styles.cardSub}>{item.addressName ?? "—"}</Text>
                  <Text style={styles.cardMeta}>
                    Week of {item.weekStartISO}
                  </Text>
                  {(() => {
                    const d = getDateForWeekDay(item.weekStartISO, item.day);
                    const now = new Date();
                    const isToday =
                      d.getFullYear() === now.getFullYear() &&
                      d.getMonth() === now.getMonth() &&
                      d.getDate() === now.getDate();
                    if (!isToday) return null;
                    return (
                      <View
                        style={{ flexDirection: "row", gap: 10, marginTop: 10 }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("TripOperations", {
                              weekStartISO: item.weekStartISO,
                              day: item.day,
                              scheduledTime: item.time,
                              ...(item.addressName
                                ? { addressName: item.addressName }
                                : {}),
                            })
                          }
                          style={styles.smallBtn}
                        >
                          <Text style={styles.smallBtnText}>Ride Actions</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Image
                    source={require("@/assets/images/no-data.png")}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptyText}>No schedule data found</Text>
                </View>
              }
            />
          </View>
          <View style={{ width }}>
            <FlatList
              data={completed}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
                gap: 10,
                flexGrow: 1,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent}
                />
              }
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {item.day} • {item.time ?? "—"}
                  </Text>
                  <Text style={styles.cardSub}>{item.addressName ?? "—"}</Text>
                  <Text style={styles.cardMeta}>
                    Ended:{" "}
                    {item.endTime
                      ? new Date(item.endTime).toLocaleString()
                      : "—"}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Image
                    source={require("@/assets/images/no-data.png")}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptyText}>No completed trips</Text>
                </View>
              }
            />
          </View>
          <View style={{ width }}>
            <FlatList
              data={rejectedData}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
                gap: 10,
                flexGrow: 1,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent}
                />
              }
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.cardTitle}>
                      {item.day} • {item.time}
                    </Text>
                  </View>
                  <Text style={styles.cardSub}>{item.addressName ?? "—"}</Text>
                  <Text style={styles.cardMeta}>
                    Week of {item.weekStartISO} • Rejected
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Image
                    source={require("@/assets/images/no-data.png")}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptyText}>No rejected schedules</Text>
                </View>
              }
            />
          </View>
        </Animated.ScrollView>
      )}
      {showActions && (
        <View style={[styles.actionsPanel, { bottom: insets.bottom + 56 }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ScheduleForm")}
            style={styles.panelBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.panelBtnText}>Plan Next Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={seedTodayForTest}
            style={styles.panelBtnSecondary}
            activeOpacity={0.9}
          >
            <Text style={styles.panelBtnTextSecondary}>Seed Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSOS}
            style={styles.panelBtnDanger}
            activeOpacity={0.9}
          >
            <Text style={styles.panelBtnTextDanger}>SOS</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        onPress={() => setShowActions((p) => !p)}
        style={[styles.fabMain, { bottom: insets.bottom }]}
        activeOpacity={0.9}
      >
        <Ionicons
          name={showActions ? "close" : "ellipsis-vertical"}
          size={18}
          color={"#1C1C1C"}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, paddingHorizontal: 16 },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
    alignItems: "flex-end",
  },
  tabBtnFlat: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTextFlat: { color: colors.textSecondary, fontWeight: "700" },
  tabTextFlatActive: { color: colors.accent },
  tabIndicator: {
    position: "absolute",
    height: 3,
    backgroundColor: colors.accent,
    bottom: 0,
    borderRadius: 2,
  },
  card: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.textPrimary, fontWeight: "700" },
  cardSub: { color: colors.textSecondary, marginTop: 4 },
  cardMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 3 / 2,
    opacity: 0.9,
  },
  emptyText: { color: colors.textSecondary },
  smallBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  smallBtnText: { color: "#1C1C1C", fontWeight: "600" },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    borderRadius: 22,
    backgroundColor: colors.accent,
    height: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  fabText: { color: "#1C1C1C", fontWeight: "700" },
  fabSmall: {
    position: "absolute",
    right: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabSmallText: { color: colors.textPrimary, fontWeight: "600", fontSize: 13 },
  actionsPanel: {
    position: "absolute",
    right: 16,
    gap: 10,
    alignItems: "flex-end",
  },
  fabMain: {
    position: "absolute",
    right: 16,
    borderRadius: 22,
    backgroundColor: colors.accent,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  fabDanger: {
    position: "absolute",
    right: 16,
    borderRadius: 22,
    backgroundColor: colors.danger,
    height: 44,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabDangerText: { color: "#fff", fontWeight: "800" },
  panelBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  panelBtnText: { color: "#1C1C1C", fontWeight: "700" },
  panelBtnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  panelBtnTextSecondary: { color: colors.textPrimary, fontWeight: "600" },
  panelBtnDanger: {
    backgroundColor: colors.danger,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  panelBtnTextDanger: { color: "#fff", fontWeight: "700" },
});
