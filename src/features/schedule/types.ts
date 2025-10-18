export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type LocationType = 'Home' | 'Office';

export type DaySchedule = {
  pickup?: { time: string; location: LocationType };
  drop?: { time: string; location: LocationType };
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


