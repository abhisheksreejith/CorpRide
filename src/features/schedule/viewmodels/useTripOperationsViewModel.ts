import React from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { showMessage } from '@/components/ui/Toast';
import type { DayKey, TripDocument, TripGeoPoint } from '@/features/schedule/types';

export type TripOpsState = {
  uid: string | null;
  weekStartISO: string;
  day: DayKey;
  driverName: string;
  trackingLink: string;
  scheduledTime?: string | undefined;
  addressName?: string | undefined;
  status: TripDocument['status'];
  pushSentAt?: number;
  qrValidatedAt?: number;
  startTime?: number;
  endTime?: number;
  startGeo?: TripGeoPoint | undefined;
  endGeo?: TripGeoPoint | undefined;
  isWorking: boolean;
};

export function useTripOperationsViewModel(params: { weekStartISO: string; day: DayKey; scheduledTime?: string; addressName?: string }) {
  const { weekStartISO, day, scheduledTime, addressName } = params;
  const [state, setState] = React.useState<TripOpsState>({
    uid: auth().currentUser?.uid ?? null,
    weekStartISO,
    day,
    driverName: 'Rahul Kumar',
    trackingLink: 'https://example.com/tracking/mock',
    scheduledTime,
    addressName,
    status: 'pending',
    isWorking: false,
  });

  const ensureDoc = async (): Promise<string | null> => {
    const uid = auth().currentUser?.uid;
    if (!uid) return null;
    const docId = `${uid}_${state.weekStartISO}_${state.day}`;
    const ref = firestore().collection('trips').doc(docId);
    const snap = await ref.get();
    if (!snap.exists) {
      const payload: TripDocument = {
        uid,
        weekStartISO: state.weekStartISO,
        day: state.day,
        ...(state.scheduledTime ? { scheduledTime: state.scheduledTime } : {}),
        ...(state.addressName ? { addressName: state.addressName } : {}),
        driverName: state.driverName,
        trackingLink: state.trackingLink,
        status: 'pending',
        createdAt: Date.now(),
      };
      await ref.set(payload);
    }
    return docId;
  };

  const sendPush = async (customEta?: number) => {
    setState(prev => ({ ...prev, isWorking: true }));
    try {
      const docId = await ensureDoc();
      if (!docId) throw new Error('No user');
      const pushSentAt = Date.now();
      const etaMinutes = customEta ?? 12;
      await firestore().collection('trips').doc(docId).set({ pushSentAt, etaMinutes }, { merge: true });
      // also write a notification record (mock)
      const uid = auth().currentUser?.uid!;
      await firestore().collection('users').doc(uid).collection('notifications').add({
        type: 'trip_eta',
        title: 'Your ride is on the way',
        body: `Driver ${state.driverName} arrives in ~${etaMinutes} min. Track: ${state.trackingLink}`,
        createdAt: pushSentAt,
      });
      setState(prev => ({ ...prev, pushSentAt }));
      showMessage('Push notification sent (mock)');
    } catch {
      showMessage('Failed to send push', 'error');
    } finally {
      setState(prev => ({ ...prev, isWorking: false }));
    }
  };

  const validateQr = async () => {
    setState(prev => ({ ...prev, isWorking: true }));
    try {
      const docId = await ensureDoc();
      if (!docId) throw new Error('No user');
      const qrValidatedAt = Date.now();
      await firestore().collection('trips').doc(docId).set({ qrValidatedAt, status: 'in_progress' }, { merge: true });
      setState(prev => ({ ...prev, qrValidatedAt, status: 'in_progress' }));
      showMessage('QR scanned: trip started');
    } catch {
      showMessage('QR validation failed', 'error');
    } finally {
      setState(prev => ({ ...prev, isWorking: false }));
    }
  };

  const startTrip = async (geo?: TripGeoPoint) => {
    setState(prev => ({ ...prev, isWorking: true }));
    try {
      const docId = await ensureDoc();
      if (!docId) throw new Error('No user');
      const startTime = Date.now();
      await firestore().collection('trips').doc(docId).set({ startTime, startGeo: geo, status: 'in_progress' }, { merge: true });
      setState(prev => ({ ...prev, startTime, startGeo: geo ?? prev.startGeo, status: 'in_progress' }));
      // send ETA push on start
      await sendPush(10);
      showMessage('Trip started');
    } catch {
      showMessage('Failed to start trip', 'error');
    } finally {
      setState(prev => ({ ...prev, isWorking: false }));
    }
  };

  const endTrip = async (geo?: TripGeoPoint) => {
    setState(prev => ({ ...prev, isWorking: true }));
    try {
      const docId = await ensureDoc();
      if (!docId) throw new Error('No user');
      const endTime = Date.now();
      await firestore().collection('trips').doc(docId).set({ endTime, endGeo: geo, status: 'completed' }, { merge: true });
      setState(prev => ({ ...prev, endTime, endGeo: geo ?? prev.endGeo, status: 'completed' }));
      showMessage('Trip completed');
    } catch {
      showMessage('Failed to end trip', 'error');
    } finally {
      setState(prev => ({ ...prev, isWorking: false }));
    }
  };

  return { state, sendPush, validateQr, startTrip, endTrip };
}


