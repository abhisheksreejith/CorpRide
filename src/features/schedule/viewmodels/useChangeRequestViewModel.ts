import React from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { showMessage } from '@/components/ui/Toast';
import type { DayKey, ChangeRequestDocument } from '@/features/schedule/types';
import { getDateForWeekDay, isAtLeastNDaysAway } from '@/features/schedule/types';
import type { SavedAddress } from '@/features/profile/viewmodels/useSavedAddressesViewModel';

export type ChangeRequestState = {
  weekStartISO: string;
  day: DayKey;
  oldTime?: string | undefined;
  oldAddressId?: string | undefined;
  oldAddressName?: string | undefined;
  newTime: string;
  newAddress?: { id: string; name: string } | null;
  isSubmitting: boolean;
  addresses: SavedAddress[];
  canRequest: boolean;
};

export function useChangeRequestViewModel(params: { weekStartISO: string; day: DayKey; current?: { time?: string; addressId?: string; addressName?: string } }) {
  const { weekStartISO, day, current } = params;
  const [state, setState] = React.useState<ChangeRequestState>({
    weekStartISO,
    day,
    oldTime: current?.time ?? undefined,
    oldAddressId: current?.addressId ?? undefined,
    oldAddressName: current?.addressName ?? undefined,
    newTime: current?.time ?? '',
    newAddress: current?.addressId && current?.addressName ? { id: current.addressId, name: current.addressName } : null,
    isSubmitting: false,
    addresses: [],
    canRequest: false,
  });

  React.useEffect(() => {
    // Determine if the day is at least 7 days away
    const targetDate = getDateForWeekDay(weekStartISO, day);
    const allowed = isAtLeastNDaysAway(targetDate, 7);
    setState(prev => ({ ...prev, canRequest: allowed }));
  }, [weekStartISO, day]);

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

  const setNewTime = (t: string) => setState(prev => ({ ...prev, newTime: t }));
  const setNewAddress = (addr: { id: string; name: string } | null) => setState(prev => ({ ...prev, newAddress: addr }));

  const submit = async () => {
    if (!state.canRequest) {
      showMessage('Change requests allowed only 7+ days in advance', 'error');
      return false;
    }
    const user = auth().currentUser;
    if (!user) {
      showMessage('Not authenticated', 'error');
      return false;
    }
    if (!state.newTime || !state.newAddress?.id) {
      showMessage('Provide new time and address', 'error');
      return false;
    }
    setState(prev => ({ ...prev, isSubmitting: true }));
    try {
      const payload: ChangeRequestDocument = {
        uid: user.uid,
        weekStartISO: state.weekStartISO,
        day: state.day,
        requestedAt: Date.now(),
        oldPickup: {
          ...(state.oldTime ? { time: state.oldTime } : {}),
          ...(state.oldAddressId ? { addressId: state.oldAddressId } : {}),
          ...(state.oldAddressName ? { addressName: state.oldAddressName } : {}),
        },
        newPickup: {
          ...(state.newTime ? { time: state.newTime } : {}),
          ...(state.newAddress?.id ? { addressId: state.newAddress.id } : {}),
          ...(state.newAddress?.name ? { addressName: state.newAddress.name } : {}),
        },
        status: 'pending',
      };
      const docId = `${user.uid}_${state.weekStartISO}_${state.day}`;
      await firestore().collection('changeRequests').doc(docId).set(payload, { merge: true });
      showMessage('Change request submitted');
      return true;
    } catch (e) {
      showMessage('Failed to submit change request', 'error');
      return false;
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return { state, setNewTime, setNewAddress, submit };
}


