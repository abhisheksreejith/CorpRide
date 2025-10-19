import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import AppButton from "@/components/ui/AppButton";
import { useRoute } from "@react-navigation/native";
import { useTripOperationsViewModel } from "@/features/schedule/viewmodels/useTripOperationsViewModel";
import { useNavigation } from "@react-navigation/native";

type RouteParams = {
  weekStartISO: string;
  day: import("@/features/schedule/types").DayKey;
  scheduledTime?: string;
  addressName?: string;
};

export default function TripOperationsScreen() {
  const route = useRoute<any>();
  const params = route.params as RouteParams;
  const { state, sendPush, validateQr, startTrip, endTrip } =
    useTripOperationsViewModel(params);
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 12,
          marginBottom: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { padding: 0, marginLeft: 8 }]}>
          Day-of Operations • {state.day}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Driver: {state.driverName}</Text>
        <Text style={styles.cardSub}>
          Pickup: {state.scheduledTime ?? "—"} • {state.addressName ?? "—"}
        </Text>
        <Text style={styles.cardSub}>Tracking: {state.trackingLink}</Text>
        <Text style={styles.cardSub}>Status: {state.status}</Text>
        <Text style={styles.cardMeta}>
          Push:{" "}
          {state.pushSentAt
            ? new Date(state.pushSentAt).toLocaleTimeString()
            : "—"}
        </Text>
        <Text style={styles.cardMeta}>
          QR:{" "}
          {state.qrValidatedAt
            ? new Date(state.qrValidatedAt).toLocaleTimeString()
            : "—"}
        </Text>
        <Text style={styles.cardMeta}>
          Start:{" "}
          {state.startTime
            ? new Date(state.startTime).toLocaleTimeString()
            : "—"}
        </Text>
        <Text style={styles.cardMeta}>
          End:{" "}
          {state.endTime ? new Date(state.endTime).toLocaleTimeString() : "—"}
        </Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          <AppButton
            title="Send Push (mock)"
            onPress={sendPush}
            disabled={state.isWorking}
          />
          <AppButton
            title="Simulate QR Scan"
            onPress={validateQr}
            disabled={state.isWorking}
          />
          <AppButton
            title="Start Trip"
            onPress={() => startTrip({ latitude: 12.935, longitude: 77.614 })}
            disabled={state.isWorking}
          />
          <AppButton
            title="End Trip"
            onPress={() => endTrip({ latitude: 12.977, longitude: 77.591 })}
            disabled={state.isWorking}
          />
          {state.status === "in_progress" ? (
            <AppButton
              title="Track Live"
              onPress={() => navigation.navigate("TripTracking")}
              disabled={state.isWorking}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
  },
  cardTitle: { color: colors.textPrimary, fontWeight: "700" },
  cardSub: { color: colors.textSecondary, marginTop: 4 },
  cardMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
});
