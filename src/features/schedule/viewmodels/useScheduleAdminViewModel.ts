import React from 'react';
import firestore from '@react-native-firebase/firestore';
import { showMessage } from '@/components/ui/Toast';
import type { ScheduleDocument } from '@/features/schedule/types';

export function useScheduleAdminViewModel(weekStartISO?: string) {
  const [items, setItems] = React.useState<ScheduleDocument[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    let ref = firestore().collection('schedules') as FirebaseFirestoreTypes.CollectionReference<ScheduleDocument>;
    if (weekStartISO) {
      ref = ref.where('weekStartISO', '==', weekStartISO) as any;
    }
    const unsub = ref.onSnapshot(
      snap => {
        const data: ScheduleDocument[] = [] as any;
        snap.forEach(d => data.push(d.data() as any));
        setItems(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [weekStartISO]);

  const updateStatus = async (docId: string, status: 'approved' | 'rejected') => {
    try {
      await firestore().collection('schedules').doc(docId).set({ status }, { merge: true });
      showMessage(`Schedule ${status}`);
    } catch {
      showMessage('Failed to update schedule', 'error');
    }
  };

  return { items, loading, updateStatus };
}


