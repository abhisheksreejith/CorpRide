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

export function formatDateYMDLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  // Parse weekStartISO (YYYY-MM-DD) as LOCAL date to avoid timezone shifts
  const parts = weekStartISO.split('-').map((v) => parseInt(v, 10));
  const year = parts[0] ?? new Date().getFullYear();
  const monthIndex = (parts[1] ?? 1) - 1;
  const dayOfMonth = parts[2] ?? 1;
  const baseDate = new Date(year, monthIndex, dayOfMonth);
  baseDate.setHours(0, 0, 0, 0);
  const offsets: Record<DayKey, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const result = new Date(baseDate);
  result.setDate(baseDate.getDate() + offsets[day]);
  return result;
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

