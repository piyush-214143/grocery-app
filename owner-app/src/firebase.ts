import Constants from 'expo-constants';
import { initFirebase } from '@grocery/shared';

const firebaseConfig = Constants.expoConfig?.extra?.firebase ?? {};

export const { auth, db, storage } = initFirebase(firebaseConfig);
