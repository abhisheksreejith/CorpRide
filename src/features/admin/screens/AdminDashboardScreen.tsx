import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import AppButton from "@/components/ui/AppButton";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { useAdminDashboardViewModel } from "@/features/admin/viewmodels/useAdminDashboardViewModel";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";

export default function AdminDashboardScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, addEmployee } = useAdminDashboardViewModel();
  const onLogout = React.useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await auth().signOut();
            navigation.reset({ index: 0, routes: [{ name: "AuthGate" }] });
          } catch {}
        },
      },
    ]);
  }, [navigation]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity onPress={onLogout} style={styles.iconBtn}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardNum}>{state.total}</Text>
          <Text style={styles.cardLabel}>Total Scheduled</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNum}>{state.completed}</Text>
          <Text style={styles.cardLabel}>Completed</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNum}>{state.missed}</Text>
          <Text style={styles.cardLabel}>Missed/Cancelled</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNum}>{state.avgRating.toFixed(1)}</Text>
          <Text style={styles.cardLabel}>Avg Rating</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <AppButton
          title="Manage Approvals"
          onPress={() => navigation.navigate("ScheduleAdmin")}
          style={{ width: "100%", height: 48 }}
        />
        <AppButton
          title="Add New Employee (MOCK)"
          variant="secondary"
          onPress={async () => {
            try {
              await addEmployee();
            } catch {}
          }}
          style={{ width: "100%", height: 44 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  grid: { padding: 16, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardNum: { color: colors.textPrimary, fontSize: 24, fontWeight: "800" },
  cardLabel: { color: colors.textSecondary, marginTop: 6 },
  footer: { padding: 16, gap: 12 },
});
