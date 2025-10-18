import React from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { showMessage } from '@/components/ui/Toast';
import * as Location from 'expo-location';
export type ProfileFormState = {
  fullName: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  address: string;
  isFetchingAddress: boolean;
};

export function useProfileViewModel() {
  const currentUser = auth().currentUser;
  const [state, setState] = React.useState<ProfileFormState>({
    fullName: '',
    email: currentUser?.email ?? '',
    phone: '',
    gender: '',
    address: '',
    isFetchingAddress: false,
  });

  const setField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) =>
    setState(prev => ({ ...prev, [key]: value }));

  const submit = async () => {
    const user = auth().currentUser;
    if (!user) {
      showMessage('Not authenticated', 'error');
      return false;
    }
    try {
      await firestore().collection('users').doc(user.uid).set(
        {
          fullName: state.fullName,
          email: state.email,
          phone: state.phone,
          gender: state.gender,
          address: state.address,
          profileCompleted: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      showMessage('Profile saved');
      return true;
    } catch (e) {
      console.error(e);
      showMessage('Failed to save profile', 'error');
      return false;
    }
  };

  const fillAddressFromLocation = async () => {
    try {
      setState(prev => ({ ...prev, isFetchingAddress: true }));
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showMessage('Location permission not granted', 'error');
        setState(prev => ({ ...prev, isFetchingAddress: false }));
        return false;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const composed = [
        place.name,
        place.street,
        place.postalCode,
        place.city || place.subregion,
        place.region,
        place.country,
      ]
        .filter(Boolean)
        .join(', ');
      setState(prev => ({ ...prev, address: composed, isFetchingAddress: false }));
      return true;
    } catch {
      setState(prev => ({ ...prev, isFetchingAddress: false }));
      return false;
    }
  };

  // Prefill from Firestore if admin has already created data for the employee
  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    (async () => {
      try {
        const doc = await firestore().collection('users').doc(user.uid).get();
        const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : (doc as any).exists;
        if (!exists) return;
        const data = doc.data() as Partial<ProfileFormState> | undefined;
        if (!data) return;
        setState(prev => ({
          ...prev,
          fullName: typeof data.fullName === 'string' ? data.fullName : prev.fullName,
          email: typeof data.email === 'string' ? data.email : prev.email,
          phone: typeof data.phone === 'string' ? data.phone : prev.phone,
          gender: (data.gender as ProfileFormState['gender']) ?? prev.gender,
          address: typeof data.address === 'string' ? data.address : prev.address,
        }));
      } catch {
        // ignore silently for now
      }
    })();
  }, []);

  return { state, setField, submit, fillAddressFromLocation };
}


