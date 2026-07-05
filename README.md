# Local Grocery App

Two Expo (React Native) apps — `customer-app` and `owner-app` — sharing one Firebase
project and one `shared/` package (Firebase config, types, i18n, constants, utils,
push helper). Built for a single small store, free-tier only, and verified end-to-end
against a live Firebase backend.

```
/grocery-app
  /customer-app   Customer-facing app
  /owner-app      Shop owner app
  /shared         Shared Firebase/types/i18n/constants/utils (npm workspace package)
  /scripts        One-off seed script (standalone, not a workspace member)
  firestore.rules, firestore.indexes.json, storage.rules, firebase.json
```

## What's actually live right now

- **Firebase project:** `local-grocery-app-piyush`, created via `firebase-tools` CLI.
  - Firestore database live in `asia-south1`, `firestore.rules` and
    `firestore.indexes.json` deployed.
  - Email/Password sign-in enabled.
  - Two Web apps registered (Customer, Owner) — their config is already filled into
    `customer-app/.env` and `owner-app/.env`.
  - Two Android apps registered (`com.localgrocery.customer`,
    `com.localgrocery.owner`) — their `google-services.json` files are already
    downloaded into each app folder (gitignored).
  - Storage was **not** enabled (see decision below) — `storage.rules` exists but
    isn't deployed.
- **Demo data seeded:** 1 shop ("Sharma General Store"), 5 categories, 24 products
  with picsum.photos placeholder images.
- **An owner account and a customer account both exist** in this Firebase project
  from live testing (see "How this was verified" below). Feel free to reuse them or
  create your own — the owner login has no admin UI to manage other accounts, so if
  you want a clean slate, delete users from Firebase Console → Authentication.
- **Both apps typecheck cleanly** (`npx tsc --noEmit`) and bundle cleanly via Metro.
- **Both release APKs are already built** (local Gradle build, see "Building an
  installable APK" below) and confirmed to install and launch standalone (no Metro
  needed) on an emulator — copies were placed on the Desktop at
  `~/Desktop/grocery-app-apks/grocery-customer.apk` and `grocery-owner.apk`. The
  native `android/` project folders that produced them are gitignored (regenerate
  anytime with `npx expo prebuild --platform android`).

If you're picking this up on a fresh machine, jump to **"Fresh machine setup"**
below. If the code's already here and you just want to run it, jump to **"Running
the apps"**.

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
- **Push notifications need a real build, not Expo Go.** Expo Go dropped support for
  remote push entirely from SDK 53 onward — importing `expo-notifications` inside
  Expo Go throws immediately (not just calling it; merely loading the module).
  `shared/push/index.ts` detects Expo Go via `Constants.executionEnvironment` and
  skips loading the module there, so the rest of the app still works fine in Expo
  Go — you only need an EAS build (dev client, preview, or production) to actually
  exercise push notifications.
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
  **Gotcha found during testing:** `onAuthStateChanged` (which triggers the owner
  app's Firestore subscriptions) can fire before that `/admins/{uid}` write
  finishes, causing a one-time `permission-denied`. `firestoreService.ts`'s
  `subscribeWithRetry()` retries with backoff to paper over that race.
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
- **Firestore rejects `undefined` field values outright** (not just at the type
  level — `addDoc`/`setDoc` throw at runtime). `customerNote` (optional, empty by
  default) and `ownerFcmToken` (absent until a push token is registered) both hit
  this; both are now written via conditional spread (`...(x ? { key: x } : {})`)
  instead of `key: x ?? undefined`.

## How this was built (full timeline)

1. Scaffolded both Expo apps (`create-expo-app`, blank-typescript template, Expo
   SDK 57 / React 19 / RN 0.86) plus the `shared/` npm workspace package, wired
   together via `metro.config.js` (`watchFolders` + `nodeModulesPaths`) in each app
   so both apps can `import from '@grocery/shared'`.
   - Hit a real monorepo trap here: after incremental `npm install`s (before vs.
     after the root `package.json` workspaces existed), npm hoisted `react` and
     `react-native` to the root `node_modules` but left `@types/react` duplicated
     per-app. That split-brain type resolution made every `<View>`/`<Text>` fail
     to typecheck. Fixed with a clean `rm -rf node_modules && npm install` from
     the repo root so hoisting happens in one consistent pass.
2. Built out both apps' full screen set (auth, home/browsing, cart, checkout,
   order tracking, daily-reorder on the customer side; dashboard, categories,
   products, settings, live orders/history on the owner side) against
   placeholder/no Firebase config, verified with `tsc --noEmit` and
   `expo export --platform android` (bundling 1000+ modules cleanly) before any
   real backend existed.
3. Wrote `firestore.rules`, `storage.rules`, `firestore.indexes.json`, and the
   `scripts/seed.mjs` Admin SDK seeder.
4. Created the actual Firebase project via `firebase-tools` CLI end-to-end:
   `firebase login` (has to run in a real interactive terminal — CLI tooling
   without a TTY can't complete the OAuth handshake), `projects:create`,
   `firestore:databases:create`, `deploy --only firestore:rules,firestore:indexes`,
   `apps:create` (Web ×2, Android ×2), `apps:sdkconfig` to pull the config
   straight into both `.env` files and both `google-services.json` files.
   Two things turned out to have no CLI equivalent and needed one console click
   each: enabling Email/Password sign-in, and (see below) Storage.
5. Hit Storage requiring Blaze (Feb 2026 policy change) and, per instruction,
   backed out of Storage entirely rather than add a card — see the decision above.
6. Ran a real end-to-end test on an Android emulator against the live project:
   booted the emulator, ran each app through Expo Go (`--go` flag, since
   `expo-dev-client` being installed makes Expo CLI default to dev-client mode),
   signed up a customer, placed a COD order, then logged into the owner app
   (first-time setup) and watched the order arrive live, accepted it, and watched
   the status change reflect back to the customer's order detail screen live.
   This caught three real bugs (Expo Go crashing on `expo-notifications` import,
   Firestore rejecting `undefined` fields, and the admin-doc race condition above)
   — all fixed and covered in the decisions section.

## Fresh machine setup

If you're setting this up somewhere the code doesn't already exist:

### 1. Create the Firebase project

```bash
npx firebase-tools login          # opens a browser; must run in a real terminal
cd grocery-app
npx firebase-tools projects:create <your-project-id> --display-name "Your Shop"
npx firebase-tools use --add       # pick the project you just made, alias "default"
```

Then, console-only steps (no CLI equivalent exists for either):
- Authentication → Sign-in method → enable **Email/Password**.
- Storage → click **Get started** *only if* you're OK moving to the Blaze plan (a
  card on file) — otherwise skip it and product photos stay as placeholders.

### 2. Provision Firestore and register apps

```bash
npx firebase-tools firestore:databases:create "(default)" --location=asia-south1 --project=<your-project-id>
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project=<your-project-id>

npx firebase-tools apps:create WEB "Customer" --project=<your-project-id>
npx firebase-tools apps:create WEB "Owner" --project=<your-project-id>
npx firebase-tools apps:create ANDROID "Customer Android" --package-name com.localgrocery.customer --project=<your-project-id>
npx firebase-tools apps:create ANDROID "Owner Android" --package-name com.localgrocery.owner --project=<your-project-id>
```

`apps:create` prints an `appId` for each — use it in the next step.

### 3. Configure each app

Copy `.env.example` → `.env` in both `customer-app/` and `owner-app/`, then fill in:

```bash
npx firebase-tools apps:sdkconfig WEB <customer-web-appId> --project=<your-project-id>
npx firebase-tools apps:sdkconfig WEB <owner-web-appId> --project=<your-project-id>
npx firebase-tools apps:sdkconfig ANDROID <customer-android-appId> --project=<your-project-id> -o customer-app/google-services.json
npx firebase-tools apps:sdkconfig ANDROID <owner-android-appId> --project=<your-project-id> -o owner-app/google-services.json
```

### 4. Install dependencies

```bash
cd grocery-app && npm install   # installs and hoists everything for all 3 workspace packages in one pass
```

### 5. Seed sample data

```bash
cd scripts && npm install
# Firebase Console > Project settings > Service accounts > Generate new private key
# save the downloaded file as scripts/serviceAccountKey.json (gitignored)
npm run seed
```

Creates 1 shop doc, 5 categories, ~24 products with picsum.photos placeholders.
Edit the shop's real phone/UPI ID/address afterwards from the owner app's Shop
Settings screen.

## Running the apps

```bash
cd customer-app && npx expo start --go   # --go forces Expo Go even though expo-dev-client is installed
cd owner-app && npx expo start --go
```

Press `a` for the Android emulator, `i` for iOS simulator, or scan the QR with
Expo Go on a physical device.

First run for the owner app: on the login screen, tap **"First time setting up
this shop? Create account"** to create the owner login (this also writes the
`/admins/{uid}` doc the security rules check for).

## Building an installable APK

Two ways to get a real, standalone `.apk` (works without Expo Go, supports push
notifications since it's a real compiled app, not the Expo Go client):

### Option A: Local build (no account needed at all)

What was actually used to produce the APKs for this project — needs a local
Android SDK + JDK (already set up on this machine: Java 17, Android SDK at
`~/Library/Android/sdk`), but no Expo/EAS account and no cloud service.

```bash
cd customer-app
npx expo prebuild --platform android --clean   # generates the android/ native project (gitignored, regenerate anytime)
cd android
./gradlew assembleRelease                      # builds locally; first run downloads Gradle deps, ~3-5 min
```

The APK lands at `customer-app/android/app/build/outputs/apk/release/app-release.apk`.
Repeat the same three commands inside `owner-app/`.

**Only build one app's APK at a time.** Both apps share the same hoisted
`node_modules` (npm workspaces), and their native modules (`react-native-svg`,
`netinfo`, etc.) generate build artifacts *inside* those shared
`node_modules/<package>/android/build` folders — running two `gradlew
assembleRelease` calls at once corrupts both builds via a race condition. Build
one, wait for `BUILD SUCCESSFUL`, then build the other. If a build fails
strangely, clean the shared caches and retry:

```bash
cd grocery-app
find node_modules -maxdepth 3 -type d \( -name build -o -name .cxx \) -path "*/android/*" -exec rm -rf {} +
```

This produces an **unsigned-with-debug-key** release APK — fully functional,
installable, and fine for personal testing/demoing. It is not suitable for
uploading to the Play Store (that needs a real upload keystore), but nothing
here needs that yet.

Install it:
```bash
adb install path/to/app-release.apk        # with an emulator/device connected
```
Or transfer the `.apk` to a physical Android phone and open it (allow "install
from unknown sources" once, since it's not from the Play Store).

### Option B: EAS cloud build (needs a free Expo account)

EAS Build's free tier gives 15 Android builds/month, no credit card required
(unlike Firestore Storage) — useful if you don't want the Android SDK installed
locally, since the build runs on Expo's servers instead.

```bash
npx eas-cli login          # opens a browser; must run in a real terminal (same as firebase login)

cd customer-app
npx eas-cli init           # links this app to an EAS project, writes an EAS project ID
npx eas-cli build --platform android --profile preview
```

Takes several minutes; prints a download link when done (also visible at
https://expo.dev under your account's builds). Repeat inside `owner-app/`.

### If you want a dev client instead

The `development` profile in `eas.json` (or `assembleDebug` locally, or
`--profile development` with EAS) builds a dev-client APK instead of a fully
standalone build. Once installed, run `npx expo start --dev-client` and it
connects to your local Metro bundler for fast-refresh development.

## End-to-end smoke test

Already verified once (see timeline above), but to redo it yourself:

1. Owner app: log in → Shop Settings → confirm shop is "Open" → Products tab shows
   the seeded catalog.
2. Customer app: sign up → pick a language → browse → add items → checkout with
   an address → place order (COD or UPI).
3. Owner app: the order appears instantly in Live Orders (Firestore real-time
   listener, no refresh needed) → open it → Accept → Packed → Out for Delivery →
   Delivered.
4. Customer app: My Orders / Order Detail updates status live at each step.
