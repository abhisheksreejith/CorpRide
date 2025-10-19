import React from "react";
import firestore from "@react-native-firebase/firestore";

export type AdminDashboardState = {
  total: number;
  completed: number;
  missed: number;
  avgRating: number;
};

export function useAdminDashboardViewModel() {
  const [state, setState] = React.useState<AdminDashboardState>({
    total: 0,
    completed: 0,
    missed: 0,
    avgRating: 4.6,
  });

  React.useEffect(() => {
    const unsub1 = firestore()
      .collection("schedules")
      .onSnapshot((s) => setState((prev) => ({ ...prev, total: s.size })));
    const unsub2 = firestore()
      .collection("trips")
      .where("status", "==", "completed")
      .onSnapshot((s) => setState((prev) => ({ ...prev, completed: s.size })));
    const unsub3 = firestore()
      .collection("trips")
      .where("status", "==", "cancelled")
      .onSnapshot((s) => setState((prev) => ({ ...prev, missed: s.size })));
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const addEmployee = async () => {
    const idx = Math.floor(Math.random() * 10000);
    const payload: any = {
      fullName: `Employee ${idx}`,
      email: `employee${idx}@example.com`,
      phone: `99999${String(idx).padStart(5, "0")}`,
      profileCompleted: false,
      isAdmin: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    await firestore().collection("users").add(payload);
  };

  return { state, addEmployee };
}
