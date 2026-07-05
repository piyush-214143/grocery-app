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
  cart, checkout, product management, etc.) works fine in plain Expo Go — you only
  need a dev client build to actually test push notifications.
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
- **No real product photo upload (for now).** As of a February 2026 policy
  change, provisioning a Cloud Storage bucket at all now requires the Blaze
  plan (a card on file), even though usage would likely stay within Storage's
  free no-cost quota. Since this project is intentionally staying on Spark
  with zero billing risk, the owner app's product form cycles through
  picsum.photos placeholders instead of uploading real photos (tap the image
  to get a different placeholder). `uploadProductImage()` in
  `owner-app/src/services/firestoreService.ts` and `storage.rules` are both
  still there, ready to wire back into `ProductFormScreen.tsx` the day you
  add a card and upgrade to Blaze.

## Current live status

- **Firebase project:** `local-grocery-app-piyush` (created, Firestore database live
  in `asia-south1`, `firestore.rules` + `firestore.indexes.json` deployed).
- **Both apps' `.env` files** are already filled in with the real Firebase config,
  and `google-services.json` is already downloaded into both `customer-app/` and
  `owner-app/`.
- **Storage:** intentionally skipped (see above) — `storage.rules` is not deployed.
- **Still needed from you:** enable Email/Password sign-in (one console click,
  step 1 below), then seed data and run the apps (steps 2–3).

## 1. Enable Email/Password sign-in (one-time, console only)

There's no CLI command for toggling Auth providers. Open
https://console.firebase.google.com/project/local-grocery-app-piyush/authentication/providers
→ click **Email/Password** → **Enable** → **Save**.

## 2. Seed sample data

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

## 3. Run the apps

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

## 4. End-to-end smoke test

1. Owner app: log in → Shop Settings → confirm shop is "Open" → Products tab shows
   the seeded catalog.
2. Customer app: sign up → pick a language → browse → add items → checkout with
   an address → place order (COD or UPI).
3. Owner app: the order appears instantly in Live Orders (Firestore real-time
   listener, no refresh needed) → open it → Accept → Packed → Out for Delivery →
   Delivered.
4. Customer app: My Orders / Order Detail updates status live at each step.
