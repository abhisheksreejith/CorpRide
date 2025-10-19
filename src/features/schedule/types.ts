export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type DaySchedule = {
  pickup?: { time: string; addressId?: string; addressName?: string };
  drop?: { addressId?: string; addressName?: string };
};

export type WeekSchedule = Record<DayKey, DaySchedule>;

export type ScheduleDocument = {
  uid: string;
  weekStartISO: string; // Monday ISO date
  createdAt: number;
  lockedAt?: number;
  schedule: WeekSchedule;
  status: 'submitted' | 'approved' | 'rejected' | 'draft';
  reviewerUid?: string;
  reviewNote?: string;
};

export function getNextWeekMonday(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = ((8 - (day === 0 ? 7 : day)) % 7) + 1; // days to next Monday
  d.setDate(d.getDate() + diffToMon);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatTimeHHmm(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function isDeadlinePassed(now: Date, deadline: Date) {
  return now.getTime() >= deadline.getTime();
}


// Maps a weekStartISO (Monday) and a DayKey to a concrete Date
export function getDateForWeekDay(weekStartISO: string, day: DayKey): Date {
  const base = new Date(weekStartISO);
  base.setHours(0, 0, 0, 0);
  const offsets: Record<DayKey, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const d = new Date(base);
  d.setDate(base.getDate() + offsets[day]);
  return d;
}

export function isAtLeastNDaysAway(target: Date, n: number): boolean {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return diffMs >= n * 24 * 60 * 60 * 1000;
}

export type ChangeRequestDocument = {
  uid: string;
  weekStartISO: string;
  day: DayKey;
  requestedAt: number;
  oldPickup?: { time?: string; addressId?: string; addressName?: string };
  newPickup: { time?: string; addressId?: string; addressName?: string };
  status: 'pending' | 'approved' | 'rejected';
  reviewerUid?: string;
  reviewNote?: string;
};

export type TripGeoPoint = { latitude: number; longitude: number };

export type TripDocument = {
  uid: string;
  weekStartISO: string;
  day: DayKey;
  scheduledTime?: string;
  addressId?: string;
  addressName?: string;
  driverName: string;
  trackingLink: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  pushSentAt?: number;
  etaMinutes?: number;
  qrValidatedAt?: number;
  startTime?: number;
  endTime?: number;
  startGeo?: TripGeoPoint;
  endGeo?: TripGeoPoint;
  createdAt: number;
};

