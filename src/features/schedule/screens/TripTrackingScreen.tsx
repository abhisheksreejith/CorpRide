import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { colors } from "@/theme/colors";
import { useTripTracking } from "@/features/schedule/viewmodels/useTripTracking";

export default function TripTrackingScreen() {
  const { state } = useTripTracking();
  const origin = state.path[0] ?? state.currentCoord;
  const dest = state.path[state.path.length - 1] ?? state.currentCoord;
  const insets = useSafeAreaInsets();
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

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Live Ride</Text>
        <Text style={styles.subtitle}>ETA ~ {state.etaMinutes} min</Text>
      </View>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Polyline
          coordinates={state.path}
          strokeColor={colors.accent}
          strokeWidth={4}
        />
        <Marker coordinate={origin} title="Start" />
        <Marker coordinate={dest} title="Destination" />
        <Marker
          coordinate={state.currentCoord}
          title="Cab"
          pinColor={colors.accent}
        />
      </MapView>
      <View style={[styles.bottomBar, { bottom: 16 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={onSOS}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 8 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, marginTop: 4 },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    zIndex: 10,
    elevation: 10,
  },
  sosBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
  },
  sosText: { color: "#fff", fontWeight: "700" },
});
