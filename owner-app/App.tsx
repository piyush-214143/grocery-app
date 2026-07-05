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
import { useOrdersStore } from './src/store/useOrdersStore';
import {
  subscribeToShop,
  subscribeToCategories,
  subscribeToAllProducts,
  subscribeToOrders,
  saveShop,
} from './src/services/firestoreService';

initI18n('en');

export default function App() {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const shop = useCatalogStore((s) => s.shop);
  const setShop = useCatalogStore((s) => s.setShop);
  const setCategories = useCatalogStore((s) => s.setCategories);
  const setProducts = useCatalogStore((s) => s.setProducts);
  const setOrders = useOrdersStore((s) => s.setOrders);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubShop = subscribeToShop(setShop);
    const unsubCategories = subscribeToCategories(setCategories);
    const unsubProducts = subscribeToAllProducts(setProducts);
    const unsubOrders = subscribeToOrders(setOrders);
    return () => {
      unsubShop();
      unsubCategories();
      unsubProducts();
      unsubOrders();
    };
  }, [firebaseUser]);

  // Registers this device to receive "new order" pushes. Runs once the shop
  // doc exists so there's somewhere to store the token.
  useEffect(() => {
    if (!firebaseUser || !shop) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    registerForPushTokenAsync(projectId)
      .then((token) => {
        if (token && token !== shop.ownerFcmToken) {
          saveShop({ ...shop, ownerFcmToken: token });
        }
      })
      .catch(() => {});
  }, [firebaseUser, shop?.id]);

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <RootNavigator />
      <StatusBar style="auto" />
    </View>
  );
}
