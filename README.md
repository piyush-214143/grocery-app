# Local Grocery App

Two Expo (React Native) apps — `customer-app` and `owner-app` — sharing one Firebase
project and one `shared/` package (Firebase config, types, i18n, constants, utils,
push helper). Built for a single small store, free-tier only.

```
/grocery-app
  /customer-app   Customer-facing app
  /owner-app      Shop owner app
  /shared         Shared Firebase/types/i18n/constants/utils (npm workspace package)
  /scripts        One-off seed script (standalone, not a workspace member)
  firestore.rules, firestore.indexes.json, storage.rules, firebase.json
```

## Decisions worth knowing about

- **Auth is email/password, not phone OTP.** Firebase Phone Auth requires the
  project to be on the Blaze (pay-as-you-go) billing plan — Spark (free) can't send
  SMS at all, regardless of the free monthly quota that only kicks in on Blaze.
  Email/password needs no billing account. Swap in phone auth later if you upgrade.
- **Push notifications go through Expo's push service, not a Cloud Function.**
  Firebase Cloud Functions (the natural way to trigger a push on `orders` writes)
  also require Blaze. Instead, the client that changes Firestore (customer on
  placing an order, owner on changing status) makes a direct HTTPS call to Expo's
  free push endpoint right after the write succeeds. Expo relays it through FCM
  (Android) / APNs (iOS) for you — see `shared/push/index.ts`. Trade-off: if the
  placing app is killed the instant after the Firestore write, before the push
  fetch completes, that one notification can be missed (the order itself is never
  lost, since it's already in Firestore). Fine for a small shop; move to a Blaze +
  Cloud Function trigger later if that edge case ever matters.
- **Push notifications need a dev client, not Expo Go.** Expo Go dropped support
  for remote push on Android from SDK 53 onward. Both apps already have
  `expo-dev-client` installed for this. Everything else in both apps (browsing,
  cart, checkout, image upload, etc.) works fine in plain Expo Go — you only need
  a dev client build to actually test push notifications.
- **Offline support is memory-only, not disk-persisted.** The `firebase` JS SDK's
  disk cache (`persistentLocalCache`) needs IndexedDB, which React Native doesn't
  have, so Firestore silently falls back to an in-memory cache. That's enough to
  avoid crashes/blank screens while offline mid-session and to queue writes until
  reconnect, but it does NOT survive killing and reopening the app while offline.
  `@react-native-firebase` (native SDK) fixes this fully but needs more native
  config — worth revisiting if offline-across-restarts becomes important.
- **Owner permissions use a client-writable `/admins/{uid}` doc, not custom
  claims.** Setting custom claims needs the Admin SDK, which needs a server
  (Cloud Functions = Blaze, again). Instead, `firestore.rules` treats whoever owns
  `/admins/{uid}` as the shop owner; only the owner-app's first-time-setup screen
  ever writes that doc, and the client can never update/delete it once created.
  Good enough for one shop; not something you'd want for a public multi-tenant app.

## 1. Create the Firebase project

1. https://console.firebase.google.com → **Add project** (Spark/free plan is fine).
2. **Build > Authentication > Get started > Sign-in method** → enable **Email/Password**.
3. **Build > Firestore Database > Create database** → start in **production mode**
   (our `firestore.rules` handles access control).
4. **Build > Storage > Get started** → production mode.
5. **Project settings > General > Your apps**: add **two Web apps** (⚙️ icon →
   "Web"), named e.g. "Customer" and "Owner". Each gives you a
   `apiKey`/`authDomain`/… config block — these power the `firebase` JS SDK in
   each app (you can reuse the exact same config for both if you don't care about
   separating them; the two-web-app split just keeps them tidy).
6. Still in **Your apps**, also add **two Android apps** with package names
   `com.localgrocery.customer` and `com.localgrocery.owner` (must match
   `app.config.js` in each folder). Download each `google-services.json` and drop
   it at `customer-app/google-services.json` and `owner-app/google-services.json`
   respectively — these are only needed for native FCM push token retrieval on
   Android and are gitignored.

## 2. Configure each app

In both `customer-app/` and `owner-app/`, copy `.env.example` to `.env` and fill
in the Web app config from step 1.5 (same Firebase project values in both `.env`
files; only `FIREBASE_APP_ID_CUSTOMER` / `FIREBASE_APP_ID_OWNER` differ).

## 3. Deploy security rules

```bash
npx firebase-tools login
npx firebase-tools use --add          # pick your project, run from the repo root
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

## 4. Seed sample data

```bash
cd scripts
npm install
# Firebase Console > Project settings > Service accounts > Generate new private key
# save the downloaded file as scripts/serviceAccountKey.json
npm run seed
```

This creates 1 shop doc, 5 categories, and ~24 products with picsum.photos
placeholder images so both apps are demo-ready immediately. Edit the shop's real
phone/UPI ID/address afterwards from the owner app's Shop Settings screen.

## 5. Run the apps

```bash
cd customer-app && npm install && npx expo start   # then press 'i' or 'a', or scan with Expo Go
cd owner-app && npm install && npx expo start
```

First run for the owner app: on the login screen, tap **"First time setting up
this shop? Create account"** to create the one owner login (this also writes the
`/admins/{uid}` doc the security rules check for).

### Testing push notifications

Push needs a dev client, not Expo Go:

```bash
cd customer-app && npx eas login && npx eas init   # writes EAS_PROJECT_ID_CUSTOMER; put it in .env
npx eas build --profile development --platform android
# repeat in owner-app with EAS_PROJECT_ID_OWNER
```

Install the resulting build on a physical device (push tokens don't work in
simulators/emulators), then `npx expo start --dev-client`.

## 6. End-to-end smoke test

1. Owner app: log in → Shop Settings → confirm shop is "Open" → Products tab shows
   the seeded catalog.
2. Customer app: sign up → pick a language → browse → add items → checkout with
   an address → place order (COD or UPI).
3. Owner app: the order appears instantly in Live Orders (Firestore real-time
   listener, no refresh needed) → open it → Accept → Packed → Out for Delivery →
   Delivered.
4. Customer app: My Orders / Order Detail updates status live at each step.
