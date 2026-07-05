import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
// @ts-ignore -- getReactNativePersistence exists in the RN bundle of firebase/auth
// but is missing from the published web type defs. See firebase/firebase-js-sdk#7615.
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Call once per app (customer/owner) with the app's own Firebase web config
// (both apps point at the same Firebase project, just different app IDs).
//
// Note on offline support: the `firebase` JS SDK's disk-based
// `persistentLocalCache()` requires IndexedDB, which React Native doesn't
// have, so Firestore silently falls back to an in-memory cache here. That's
// enough to avoid crashes/blank screens while offline mid-session and to
// queue writes until reconnect, but the cache does NOT survive an app
// restart while offline (unlike native iOS/Android SDKs). Switching to
// `@react-native-firebase` would fix that at the cost of extra native
// config -- worth it later if offline-across-restarts becomes important.
export function initFirebase(config: FirebaseOptions) {
  const app = getApps().length ? getApp() : initializeApp(config);

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh re-invokes this module; initializeAuth throws the second
    // time because the app already has an Auth instance registered.
    auth = getAuth(app);
  }

  db = getFirestore(app);
  storage = getStorage(app);

  return { app, auth, db, storage };
}

export function getFirebase() {
  if (!auth || !db || !storage) {
    throw new Error('initFirebase() must be called before getFirebase()');
  }
  return { auth, db, storage };
}
