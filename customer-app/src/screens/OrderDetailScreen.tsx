import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  UNIT_LABELS,
  formatCurrency,
  formatDateTime,
  type Order,
} from '@grocery/shared';
import { useLanguageStore } from '../store/useLanguageStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useCartStore } from '../store/useCartStore';
import { subscribeToOrder } from '../services/firestoreService';
import type { RootStackParamList } from '../navigation/types';

export function OrderDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const language = useLanguageStore((s) => s.language);
  const products = useCatalogStore((s) => s.products);
  const setAllFromProducts = useCartStore((s) => s.setAllFromProducts);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => subscribeToOrder(route.params.orderId, setOrder), [route.params.orderId]);

  if (!order) return null;

  const currentStepIndex = ORDER_STATUS_FLOW.indexOf(order.orderStatus);

  function handleRepeatOrder() {
    if (!order) return;
    const items = order.items
      .map((line) => {
        const product = products.find((p) => p.id === line.productId);
        return product ? { product, qty: line.qty } : null;
      })
      .filter((x): x is { product: (typeof products)[number]; qty: number } => x !== null);

    if (items.length === 0) {
      Alert.alert('', 'These items are no longer available.');
      return;
    }
    setAllFromProducts(items);
    navigation.navigate('Cart');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.date}>{formatDateTime(order.placedAt)}</Text>

        {order.orderStatus === 'cancelled' ? (
          <Text style={styles.cancelled}>{ORDER_STATUS_LABELS.cancelled[language]}</Text>
        ) : (
          <View style={styles.timeline}>
            {ORDER_STATUS_FLOW.map((status, index) => (
              <View key={status} style={styles.timelineRow}>
                <View style={[styles.timelineDot, index <= currentStepIndex && styles.timelineDotActive]} />
                <Text style={[styles.timelineLabel, index <= currentStepIndex && styles.timelineLabelActive]}>
                  {ORDER_STATUS_LABELS[status][language]}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('orders.items')}</Text>
        {order.items.map((item) => (
          <View key={item.productId} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.name_en} x {item.qty} {UNIT_LABELS[item.unit]}
            </Text>
            <Text style={styles.itemPrice}>{formatCurrency(item.price * item.qty)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('orders.total')}</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
        </View>

        <Text style={styles.deliveryAddress}>{order.deliveryAddress.fullAddress}</Text>
        <Text style={styles.paymentInfo}>
          {order.paymentMode} · {order.paymentStatus}
        </Text>

        <Pressable style={styles.repeatButton} onPress={handleRepeatOrder}>
          <Text style={styles.repeatButtonText}>{t('orders.repeatOrder')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  orderId: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  date: { color: COLORS.textMuted, marginTop: 2, marginBottom: 16 },
  cancelled: { color: COLORS.danger, fontWeight: '700', fontSize: 16, marginBottom: 16 },
  timeline: { marginBottom: 20 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.border, marginRight: 10 },
  timelineDotActive: { backgroundColor: COLORS.primary },
  timelineLabel: { color: COLORS.textMuted, fontWeight: '600' },
  timelineLabelActive: { color: COLORS.text },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { color: COLORS.text, flex: 1, marginRight: 8 },
  itemPrice: { color: COLORS.text, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: { color: COLORS.textMuted, fontWeight: '700' },
  totalValue: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  deliveryAddress: { marginTop: 16, color: COLORS.textMuted },
  paymentInfo: { marginTop: 4, color: COLORS.textMuted, fontWeight: '600' },
  repeatButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  repeatButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
