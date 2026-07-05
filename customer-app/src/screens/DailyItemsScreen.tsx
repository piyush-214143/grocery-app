import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, type Order } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToUserOrders } from '../services/firestoreService';
import { ProductCard } from '../components/ProductCard';
import { CartBar } from '../components/CartBar';
import type { RootStackParamList } from '../navigation/types';

export function DailyItemsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const products = useCatalogStore((s) => s.products);
  const mergeItems = useCartStore((s) => s.mergeItems);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeToUserOrders(firebaseUser.uid, setOrders);
  }, [firebaseUser]);

  const dailyProducts = useMemo(() => products.filter((p) => p.isDailyItem), [products]);
  const lastOrder = orders.find((o) => o.orderStatus !== 'cancelled');

  function handleQuickReorder() {
    if (!lastOrder) return;
    const items = lastOrder.items
      .map((line) => {
        const product = products.find((p) => p.id === line.productId && p.isDailyItem && p.isAvailable);
        return product ? { product, qty: line.qty } : null;
      })
      .filter((x): x is { product: (typeof products)[number]; qty: number } => x !== null);

    if (items.length === 0) {
      Alert.alert('', 'No daily items found in your last order.');
      return;
    }
    mergeItems(items);
    navigation.navigate('Cart');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('dailyItems.title')}</Text>
        <Text style={styles.subtitle}>{t('dailyItems.subtitle')}</Text>
      </View>

      {lastOrder && (
        <Pressable style={styles.reorderButton} onPress={handleQuickReorder}>
          <Text style={styles.reorderButtonText}>⚡ {t('dailyItems.quickReorder')}</Text>
        </Pressable>
      )}

      <FlatList
        data={dailyProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
        )}
      />
      <CartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  reorderButton: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reorderButtonText: { color: '#fff', fontWeight: '700' },
  list: { padding: 12, paddingBottom: 90 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
});
