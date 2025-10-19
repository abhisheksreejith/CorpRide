import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import AppButton from "@/components/ui/AppButton";
import { useScheduleAdminViewModel } from "@/features/schedule/viewmodels/useScheduleAdminViewModel";

export default function ScheduleAdminScreen() {
  const { items, loading, updateStatus } = useScheduleAdminViewModel();
  const [userNames, setUserNames] = React.useState<Record<string, string>>({});
  const navigation = useNavigation<any>();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Load names for visible users
    const uids = Array.from(new Set(items.map((i) => i.uid)));
    if (uids.length === 0) return;
    let mounted = true;
    (async () => {
      try {
        const snaps = await Promise.all(
          uids.map((uid) => firestore().collection("users").doc(uid).get())
        );
        if (!mounted) return;
        const map: Record<string, string> = {};
        snaps.forEach((s) => {
          const d = s.data() as any;
          if (d?.fullName) map[s.id] = d.fullName as string;
          else if (d?.email) map[s.id] = d.email as string;
        });
        setUserNames((prev) => ({ ...prev, ...map }));
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [items]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Weekly Schedules</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => `${i.uid}_${i.weekStartISO}`}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                User: {userNames[item.uid] ?? item.uid}
              </Text>
              <Text style={styles.cardSub}>Week: {item.weekStartISO}</Text>
              <Text style={styles.cardSub}>Status: {item.status === "approved" ? "Approved" : item.status === "rejected" ? "Rejected" : item.status === "submitted" ? "Submitted" : "Pending"}</Text>
              {(item.status === 'submitted' || item.status === 'draft') && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={async () => {
                      const id = `${item.uid}_${item.weekStartISO}`;
                      setPendingId(id + '_approved');
                      try { await updateStatus(id, 'approved'); } finally { setPendingId(null); }
                    }}
                    style={styles.chipApprove}
                  >
                    {pendingId === `${item.uid}_${item.weekStartISO}_approved` ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Text style={styles.chipTextApprove}>Approve</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      const id = `${item.uid}_${item.weekStartISO}`;
                      setPendingId(id + '_rejected');
                      try { await updateStatus(id, 'rejected'); } finally { setPendingId(null); }
                    }}
                    style={styles.chipReject}
                  >
                    {pendingId === `${item.uid}_${item.weekStartISO}_rejected` ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <Text style={styles.chipTextReject}>Reject</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
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
  subtitle: { color: colors.textSecondary, paddingHorizontal: 16 },
  card: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.textPrimary, fontWeight: "700" },
  cardSub: { color: colors.textSecondary, marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  chipApprove: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentTint,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipReject: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipTextApprove: { color: colors.accent, fontWeight: "700" },
  chipTextReject: { color: colors.textSecondary, fontWeight: "700" },
});
