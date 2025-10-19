import React from "react";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type {
  DayKey,
  WeekSchedule,
  TripDocument,
} from "@/features/schedule/types";
import { getDateForWeekDay } from "@/features/schedule/types";

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
              status: data.status,
              ...(p.addressName ? { addressName: p.addressName } : {}),
            });
          }
        });
      });
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

  const nowTs = Date.now();
  const nextData = React.useMemo(
    () =>
      items
        .filter(
          (it) => it.status === "approved" && getItemDateTime(it) >= nowTs
        )
        .sort((a, b) => getItemDateTime(a) - getItemDateTime(b)),
    [items, getItemDateTime, nowTs]
  );

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
      completed,
      rejectedData,
    },
    setTab,
    onRefresh,
  } as const;
}
