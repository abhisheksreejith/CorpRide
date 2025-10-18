import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// With React Native Firebase, the default app is auto-initialized from native
// google-services files. Simply reference it:
const app = firebase.app();

export { app, auth, firestore };
