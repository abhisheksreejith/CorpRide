import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import auth from '@react-native-firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSSO(iosClientId: string, androidClientId: string) {
  const redirectUri = makeRedirectUri({ scheme: 'corpride' });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    responseType: 'id_token',
    redirectUri,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    const signIn = async () => {
      if (response?.type !== 'success') return;
      const idToken = response.authentication?.idToken;
      if (!idToken) return;
      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    };
    signIn();
  }, [response]);

  return { promptAsync, request };
}


