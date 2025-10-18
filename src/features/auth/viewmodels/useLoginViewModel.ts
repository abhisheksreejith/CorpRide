import React from 'react';
import auth from '@react-native-firebase/auth';

export type LoginState = {
  email: string;
  password: string;
  isSubmitting: boolean;
  error?: string;
};

export function useLoginViewModel() {
  const [state, setState] = React.useState<LoginState>({
    email: '',
    password: '',
    isSubmitting: false,
  });

  const setEmail = (email: string) => setState(prev => ({ ...prev, email }));
  const setPassword = (password: string) => setState(prev => ({ ...prev, password }));

  const submit = async () => {
    if (state.isSubmitting) return;
    setState(prev => {
      const { error: _omit, ...rest } = prev;
      return { ...rest, isSubmitting: true };
    });
    try {
      const credential = await auth().signInWithEmailAndPassword(state.email.trim(), state.password);
      return { user: credential.user };
    } catch (e) {
      const message = (e as Error)?.message ?? 'Login failed';
      setState(prev => ({ ...prev, error: message }));
      return undefined;
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return { state, setEmail, setPassword, submit };
}


