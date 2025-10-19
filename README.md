# CorpRide – Corporate Cab Management (React Native)

An internal mobile app for planning corporate cab pickups, handling change requests, day‑of operations, live tracking (simulated), and admin approvals/monitoring. Built with React Native (0.81), Expo, React Navigation, and Firebase (Auth/Firestore/Cloud Functions/FCM).

## 1) Setup

Prerequisites
- Node 18+ and npm
- Xcode (macOS) and/or Android Studio
- Firebase project with iOS/Android apps configured
  - Place `android/app/google-services.json` and `ios/GoogleService-Info.plist`

Install & Native build
```bash
npm install
# iOS
cd ios && pod install && cd ..

# First native build (Expo Dev Client)
npm run ios   # or: npm run android
```

Environment notes
- Push notifications use React Native Firebase + Cloud Functions. Device tokens are stored under `users/{uid}/fcmTokens/{token}` when a user logs in (see `AuthGateScreen.tsx`).
- Cloud Functions live under `functions/` (Node 20). The function sends FCM when a notification doc is written.

## 2) Running
```bash
# Start dev server
npm start

# iOS simulator/device
npm run ios

# Android emulator/device
npm run android
```

Cloud Functions (FCM sender)
```bash
cd functions
npm install
npm run build
# Set your active project once: firebase use --add
npm run deploy
```

## 3) Test Credentials (Admin & User)
There is no public signup (corporate‑only). For testing:
1. Create an email/password account in the app (or Firebase Console → Authentication).
2. In Firestore, set user flags at `users/{uid}`:
   - Admin: `{ isAdmin: true, profileCompleted: true, fullName: "Admin Test" }`
   - Employee: `{ profileCompleted: true, fullName: "Employee Test" }`

Below is a working test credentials:

Admin
- Email: `abhishek.admin@corpride.com`
- Password: `Admin@123`

Employee
- Email: `abhi.employee@corpride.com`
- Password: `Employee@123`

Admin will land on the Admin Dashboard; employees land on the Home tabs after profile completion.

## 4) Features Implemented
- Weekly Scheduling (MVVM)
  - Plan next week, lock once submitted (no overwrite for the week)
  - Approved vs Rejected filters; Active Now shows only approved and upcoming (today grouped previously; now a simple list)
- Change Requests (≥7 days in advance)
- Day‑of Operations (mock)
  - Send push with driver + ETA + tracking link
  - Simulated QR validation; trip start/end logging with mock geodata
- Live Tracking (simulated path + ETA)
- Safety/SOS
  - Global SOS button (dials 100)
- Admin
  - Dashboard with totals (scheduled/completed/missed) and dummy average rating
  - Weekly Schedules approval/rejection, with chips hidden once processed and spinners while updating
- Push Notifications
  - Cloud Function `onTripPushQueue` sends FCM to all tokens for a user when a notification is written under `users/{uid}/notifications`
- Seed tool
  - "Seed Today" adds a test pickup ~15 minutes ahead for the current user (for quick testing)

## 5) Trade‑offs & Notes
- Time/Week handling: `weekStartISO` is parsed as local date to avoid timezone shifts; Active Now has a small tolerance for near‑past items while testing.
- Listing UX: Initially used SectionList (Today/Upcoming); switched to a simpler FlatList to avoid grouping edge cases.
- Notifications: Foreground banners use Expo Notifications; background uses FCM delivered by the OS. Ensure permissions are granted on device.
- Admin routing: `AuthGate` solely controls navigation to avoid double navigation after login.

## 6) Not Implemented (by design/constraints)
- LLM‑based user review & rating: omitted.
- Federated login (Google/SSO): not included since users are provisioned by admins; app is not for public download.
- Real QR code scanning: not implemented; the QR flow is mocked via a button that triggers push/updates.

## 7) Where & How AI Tools Were Used
- Code scaffolding and MVVM refactors (screens → viewmodels)
- Wiring FCM (client token registration + Cloud Function stub)
- Creating seed helpers and filtering logic
- Writing documentation and README

## 8) Project Structure (high‑level)
```
src/
  features/
    auth/            # login, gate
    profile/         # employee profile, saved addresses
    schedule/        # scheduling, change requests, operations, tracking
      screens/       # UI only
      viewmodels/    # MVVM state & side‑effects
      types.ts       # shared schedule types/helpers
    admin/           # admin dashboard
  components/ui/     # shared UI (AppButton, AppTextField, Toast)
  navigation/        # AppNavigator, HomeTabs
functions/           # Firebase Cloud Functions (FCM sender)
```

## 9) Common Pitfalls
- Not seeing seeded items: ensure status="approved", time in the future, correct `weekStartISO` (current Monday), and a recent `createdAt` so the ordered query returns it.
- No pushes: verify `users/{uid}/fcmTokens` contains a token; check Cloud Function logs; ensure notification permission is granted.

---


