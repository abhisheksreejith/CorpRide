import React from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { showMessage } from '@/components/ui/Toast';

export type SavedAddress = {
  id: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  createdAt: number;
};

export function useSavedAddressesViewModel() {
  const [items, setItems] = React.useState<SavedAddress[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore().collection('users').doc(user.uid).collection('addresses').orderBy('createdAt', 'desc');
    const unsub = ref.onSnapshot(
      snap => {
        const arr: SavedAddress[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...(d.data() as Omit<SavedAddress,'id'>) }));
        setItems(arr);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const remove = async (id: string) => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      await firestore().collection('users').doc(user.uid).collection('addresses').doc(id).delete();
      showMessage('Address removed');
    } catch {
      showMessage('Failed to remove', 'error');
    }
  };

  return { items, loading, remove };
}


