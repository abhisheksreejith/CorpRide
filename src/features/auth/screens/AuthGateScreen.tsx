import React from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { colors } from "@/theme/colors";
// Dynamically import to avoid type errors if expo-notifications isn't installed yet
const ExpoNotifications = require("expo-notifications");
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/AppNavigator";

export default function AuthGateScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  React.useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (user) => {
      if (!user) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }
      try {
        // Register FCM token for this user
        try {
          // Dynamically require messaging to avoid type errors before the package is installed
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const messaging = require("@react-native-firebase/messaging")
            .default as any;
          if (messaging) {
            if (Platform.OS === "android" && Platform.Version >= 33) {
              await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
              );
            }
            try {
              await messaging().setAutoInitEnabled(true);
            } catch {}
            try {
              await messaging().registerDeviceForRemoteMessages();
            } catch {}
            await messaging().requestPermission();
            const token = await messaging().getToken();
            if (token) {
              await firestore()
                .collection("users")
                .doc(user.uid)
                .collection("fcmTokens")
                .doc(token)
                .set(
                  { createdAt: Date.now(), platform: Platform.OS },
                  { merge: true }
                );
              try {
                console.log("FCM token saved:", token);
              } catch {}
            }
            // Configure Expo Notifications
            try {
              if (Platform.OS === "android") {
                await ExpoNotifications.setNotificationChannelAsync("default", {
                  name: "Default",
                  importance: ExpoNotifications.AndroidImportance.MAX,
                });
              }
            } catch {}
            // Foreground banner using Expo Notifications
            messaging().onMessage(async (msg: any) => {
              const title = msg.notification?.title || "Notification";
              const body = msg.notification?.body || "";
              try {
                await ExpoNotifications.scheduleNotificationAsync({
                  content: { title, body },
                  trigger: null,
                });
              } catch {}
            });
          }
        } catch (e) {
          try {
            console.log("FCM setup error", e);
          } catch {}
        }

        const doc = await firestore().collection("users").doc(user.uid).get();
        const exists =
          typeof (doc as any).exists === "function"
            ? (doc as any).exists()
            : (doc as any).exists;
        const data = exists
          ? (doc.data() as { isAdmin?: boolean; profileCompleted?: boolean })
          : {};
        if (data?.isAdmin) {
          navigation.reset({ index: 0, routes: [{ name: "AdminDashboard" }] });
          return;
        }
        if (data?.profileCompleted) {
          navigation.reset({ index: 0, routes: [{ name: "HomeTabs" }] });
          return;
        }
        navigation.reset({ index: 0, routes: [{ name: "ProfileSetup" }] });
      } catch {
        navigation.reset({ index: 0, routes: [{ name: "ProfileSetup" }] });
      }
    });
    return unsub;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
