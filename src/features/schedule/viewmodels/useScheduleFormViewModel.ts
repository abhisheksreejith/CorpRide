import React from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { showMessage } from '@/components/ui/Toast';
import { DayKey, WeekSchedule, getNextWeekMonday, isDeadlinePassed } from '@/features/schedule/types';
import { SavedAddress } from '@/features/profile/viewmodels/useSavedAddressesViewModel';

export type ScheduleFormState = {
  weekStartISO: string;
  schedule: WeekSchedule;
  locked: boolean;
  isSubmitting: boolean;
  addresses: SavedAddress[];
};

const DAY_KEYS: DayKey[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function emptyWeek(): WeekSchedule {
  return DAY_KEYS.reduce((acc, d) => {
    acc[d] = {};
    return acc;
  }, {} as WeekSchedule);
}

export function useScheduleFormViewModel(deadline: { weekday: number; hour: number; minute: number } = { weekday: 5, hour: 17, minute: 0 }) {
  const nextMonday = React.useMemo(() => getNextWeekMonday(new Date()), []);
  const [state, setState] = React.useState<ScheduleFormState>({
    weekStartISO: nextMonday.toISOString().slice(0,10),
    schedule: emptyWeek(),
    locked: false,
    isSubmitting: false,
    addresses: [],
  });

  // Compute deadline = Friday 5 PM of current week (before nextMonday)
  const deadlineDate = React.useMemo(() => {
    const d = new Date(nextMonday);
    d.setDate(d.getDate() - (nextMonday.getDay() === 1 ? 3 : 3)); // go back to Friday before next Monday
    d.setHours(deadline.hour, deadline.minute, 0, 0);
    return d;
  }, [nextMonday, deadline.hour, deadline.minute]);

  React.useEffect(() => {
    const locked = false;//isDeadlinePassed(new Date(), deadlineDate);
    setState(prev => ({ ...prev, locked }));
  }, [deadlineDate]);

  // Load saved addresses for dropdowns
  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore().collection('users').doc(user.uid).collection('addresses').orderBy('createdAt', 'desc');
    const unsub = ref.onSnapshot(snap => {
      const arr: SavedAddress[] = [] as any;
      snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
      setState(prev => ({ ...prev, addresses: arr }));
    });
    return unsub;
  }, []);

  const setDay = (day: DayKey, type: 'pickup', time: string, address?: { id: string; name: string }) => {
    setState(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [type]: { time, addressId: address?.id, addressName: address?.name },
        },
      },
    }));
  };

  const submit = async () => {
    if (state.locked) {
      showMessage('Submission window is closed', 'error');
      return false;
    }
    const user = auth().currentUser;
    if (!user) {
      showMessage('Not authenticated', 'error');
      return false;
    }
    // Require at least one scheduled pickup or drop with time and address
    const hasAny = Object.values(state.schedule).some((day) => {
      const p = day.pickup;
      const pValid = !!(p && p.time && p.addressId);
      return pValid;
    });
    if (!hasAny) {
      showMessage('Add at least one pickup or drop before submitting', 'error');
      return false;
    }
    setState(prev => ({ ...prev, isSubmitting: true }));
    try {
      const payload = {
        uid: user.uid,
        weekStartISO: state.weekStartISO,
        schedule: state.schedule,
        status: 'submitted' as const,
        createdAt: Date.now(),
      };
      await firestore()
        .collection('schedules')
        .doc(`${user.uid}_${state.weekStartISO}`)
        .set(payload, { merge: true });
      showMessage('Schedule submitted');
      return true;
    } catch (e) {
      showMessage('Failed to submit schedule', 'error');
      return false;
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return { state, setDay, submit, nextMonday, deadlineDate };
}


