import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

export const onTripPushQueue = functions.region('us-central1').firestore
  .document('users/{uid}/notifications/{notifId}')
  .onCreate(async (snap, ctx) => {
    const { uid } = ctx.params as { uid: string; notifId: string };
    const data = snap.data() as {
      type?: string;
      title: string;
      body: string;
      createdAt: number;
    };

    // Fetch device tokens under users/{uid}/fcmTokens (doc id = token)
    const tokensSnap = await admin.firestore()
      .collection('users').doc(uid)
      .collection('fcmTokens').get();

    const tokens = tokensSnap.docs.map(d => d.id).filter(Boolean);
    if (tokens.length === 0) {
      console.log('No tokens for uid', uid);
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: data.title,
        body: data.body,
      },
      data: {
        type: data.type || 'trip_eta',
      },
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } },
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    const toDelete: string[] = [];
    res.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = (r.error && (r.error as any).errorInfo?.code) || r.error?.code;
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          toDelete.push(tokens[idx]);
        }
      }
    });
    // Cleanup invalid tokens
    await Promise.all(toDelete.map(t => admin.firestore().collection('users').doc(uid).collection('fcmTokens').doc(t).delete().catch(() => undefined)));
  });


