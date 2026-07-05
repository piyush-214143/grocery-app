import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { onAuthStateChanged } from 'firebase/auth';
import { initI18n, registerForPushTokenAsync } from '@grocery/shared';
import { auth } from './src/firebase';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OfflineBanner } from './src/components/OfflineBanner';
import { useAuthStore } from './src/store/useAuthStore';
import { useCatalogStore } from './src/store/useCatalogStore';
import { getUserProfile, saveUserProfile, subscribeToShop, subscribeToCategories, subscribeToAllProducts } from './src/services/firestoreService';

initI18n('en');

export default function App() {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setShop = useCatalogStore((s) => s.setShop);
  const setCategories = useCatalogStore((s) => s.setCategories);
  const setProducts = useCatalogStore((s) => s.setProducts);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setProfile(profile);

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const pushToken = await registerForPushTokenAsync(projectId).catch(() => null);
        if (pushToken && profile) {
          saveUserProfile({ ...profile, fcmToken: pushToken });
        }
      } else {
        setProfile(null);
      }
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubShop = subscribeToShop(setShop);
    const unsubCategories = subscribeToCategories(setCategories);
    const unsubProducts = subscribeToAllProducts(setProducts);
    return () => {
      unsubShop();
      unsubCategories();
      unsubProducts();
    };
  }, [firebaseUser]);

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <RootNavigator />
      <StatusBar style="auto" />
    </View>
  );
}
