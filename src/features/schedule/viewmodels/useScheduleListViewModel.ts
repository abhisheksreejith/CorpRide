import React from "react";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type {
  DayKey,
  WeekSchedule,
  TripDocument,
} from "@/features/schedule/types";
import { getDateForWeekDay, formatDateYMDLocal } from "@/features/schedule/types";
import { showMessage } from "@/components/ui/Toast";

export type PickupItem = {
  id: string;
  weekStartISO: string;
  day: DayKey;
  time: string;
  status: "submitted" | "approved" | "rejected" | "draft";
  addressName?: string;
};

export type CompletedItem = {
  id: string;
  day: DayKey;
  weekStartISO: string;
  time?: string | undefined;
  addressName?: string | undefined;
  endTime?: number | undefined;
};

type ScheduleDoc = {
  uid: string;
  weekStartISO: string;
  schedule: WeekSchedule;
  status: "submitted" | "approved" | "rejected" | "draft";
  createdAt: number;
};

export function useScheduleListViewModel() {
  const [items, setItems] = React.useState<PickupItem[]>([]);
  const [completed, setCompleted] = React.useState<CompletedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [tab, setTab] = React.useState<"next" | "completed" | "rejected">(
    "next"
  );

  const buildItems = React.useCallback(
    (docs: FirebaseFirestoreTypes.QuerySnapshot) => {
      const list: PickupItem[] = [];
      const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      try {
        // eslint-disable-next-line no-console
        console.log('[Schedule] snapshot size:', (docs as any)?.size ?? 0);
      } catch {}
      docs.forEach((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = d.data() as ScheduleDoc;
        try {
          // eslint-disable-next-line no-console
          console.log('[Schedule] doc', d.id, data);
        } catch {}
        DAYS.forEach((day) => {
          const p = data.schedule[day]?.pickup;
          if (p?.time && (p.addressName || p.addressId)) {
            list.push({
              id: `${d.id}_${day}`,
              weekStartISO: data.weekStartISO,
              day,
              time: p.time,
              status: data.status,
              ...(p.addressName ? { addressName: p.addressName } : {}),
            });
          }
        });
      });
      try {
        // eslint-disable-next-line no-console
        console.log('[Schedule] built items:', list);
      } catch {}
      setItems(list);
    },
    []
  );

  // Live updates
  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore()
      .collection("schedules")
      .where("uid", "==", user.uid)
      .orderBy("createdAt", "desc");
    const unsub = ref.onSnapshot(
      (snap) => {
        buildItems(snap);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [buildItems]);

  // Subscribe to completed trips for this user
  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore()
      .collection("trips")
      .where("uid", "==", user.uid)
      .where(
        "status",
        "==",
        "completed"
      ) as FirebaseFirestoreTypes.Query<TripDocument> as any;
    const unsub = ref.onSnapshot(
      (snap: FirebaseFirestoreTypes.QuerySnapshot) => {
        const data: CompletedItem[] = [];
        try {
          // eslint-disable-next-line no-console
          console.log('[Trips] completed snapshot size:', (snap as any)?.size ?? 0);
        } catch {}
        snap.forEach((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const t = d.data() as TripDocument;
          data.push({
            id: d.id,
            day: t.day,
            weekStartISO: t.weekStartISO,
            time: t.scheduledTime,
            addressName: t.addressName,
            endTime: t.endTime,
          });
        });
        try {
          // eslint-disable-next-line no-console
          console.log('[Trips] completed items:', data);
        } catch {}
        data.sort((a, b) => (b.endTime ?? 0) - (a.endTime ?? 0));
        setCompleted(data);
      }
    );
    return unsub;
  }, []);

  const onRefresh = React.useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    setRefreshing(true);
    try {
      const snap = await firestore()
        .collection("schedules")
        .where("uid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get({ source: "server" });
      buildItems(snap as any);
    } catch (e) {
        console.log("onRefresh error", e);
    } finally {
      setRefreshing(false);
    }
  }, [buildItems]);

  const getItemDateTime = React.useCallback((it: PickupItem) => {
    const d = getDateForWeekDay(it.weekStartISO, it.day);
    const [hh, mm] = (it.time || "00:00")
      .split(":")
      .map((x) => parseInt(x, 10));
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d.getTime();
  }, []);

  // Allow a small tolerance so very near-past seeds still appear during testing
  const nowTs = Date.now() - 5 * 60 * 1000;
  const nextData = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isSameYMD = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    return items
      .filter((it) => {
        if (it.status !== "approved") return false;
        const dt = getDateForWeekDay(it.weekStartISO, it.day);
        // Show if in future OR is today (even if slightly past) for testing visibility
        return getItemDateTime(it) >= nowTs || isSameYMD(dt, today);
      })
      .sort((a, b) => getItemDateTime(a) - getItemDateTime(b));
  }, [items, getItemDateTime, nowTs]);

  const sections = React.useMemo(() => {
    const todayRef = new Date();
    todayRef.setHours(0, 0, 0, 0);
    const isSameYMD = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const todayItems = nextData.filter((it) =>
      isSameYMD(getDateForWeekDay(it.weekStartISO, it.day), todayRef)
    );
    const upcomingItems = nextData.filter(
      (it) => !isSameYMD(getDateForWeekDay(it.weekStartISO, it.day), todayRef)
    );
    const arr: { title: string; data: PickupItem[] }[] = [];
    if (todayItems.length > 0) arr.push({ title: "Today", data: todayItems });
    if (upcomingItems.length > 0)
      arr.push({ title: "Upcoming", data: upcomingItems });
    return arr;
  }, [nextData]);

  const rejectedData = React.useMemo(
    () => items.filter((it) => it.status === "rejected"),
    [items]
  );

  return {
    state: {
      loading,
      refreshing,
      tab,
      sections,
      upcoming: nextData,
      completed,
      rejectedData,
    },
    setTab,
    onRefresh,
    async seedTodayForTest() {
      const user = auth().currentUser;
      if (!user) return false;
      try {
        const now = new Date();
        const target = new Date(now.getTime() + 15 * 60 * 1000); // 15 min ahead
        const dayIdx = target.getDay(); // 0=Sun..6=Sat; DayKey starts Mon
        const dayMap: DayKey[] = [
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ] as any;
        const dayKey = dayMap[dayIdx] as DayKey;
        // compute Monday of target week
        const monday = new Date(target);
        const diff = monday.getDay() === 0 ? -6 : 1 - monday.getDay();
        monday.setDate(monday.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        const weekStartISO = formatDateYMDLocal(monday);
        const hh = String(target.getHours()).padStart(2, "0");
        const mm = String(target.getMinutes()).padStart(2, "0");
        const time = `${hh}:${mm}`;

        const docId = `${user.uid}_${weekStartISO}`;
        const ref = firestore().collection("schedules").doc(docId);
        const snap = await ref.get();
        const rawExists: any = (snap as any).exists;
        const exists =
          typeof rawExists === "function" ? rawExists.call(snap) : rawExists;
        const payload: any = exists
          ? (snap.data() as any)
          : {
              uid: user.uid,
              weekStartISO,
              createdAt: Date.now(),
              status: "approved",
              schedule: {} as WeekSchedule,
            };
        payload.schedule = payload.schedule || {};
        if (!payload.createdAt) payload.createdAt = Date.now();
        payload.schedule[dayKey] = payload.schedule[dayKey] || {};
        payload.schedule[dayKey].pickup = { time, addressName: "Test Pickup" };
        payload.status = "approved";
        await ref.set(payload, { merge: true });
        showMessage("Seeded today's schedule");
        return true;
      } catch {
        showMessage("Failed to seed", "error");
        return false;
      }
    },
  } as const;
}
