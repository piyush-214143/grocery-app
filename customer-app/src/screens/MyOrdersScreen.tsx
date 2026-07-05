import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, ORDER_STATUS_LABELS, formatCurrency, formatDateTime, type Order } from '@grocery/shared';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { subscribeToUserOrders } from '../services/firestoreService';
import type { RootStackParamList } from '../navigation/types';

export function MyOrdersScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const language = useLanguageStore((s) => s.language);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeToUserOrders(firebaseUser.uid, setOrders);
  }, [firebaseUser]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.header}>{t('orders.title')}</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('orders.noOrders')}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.date}>{formatDateTime(item.placedAt)}</Text>
            </View>
            <Text style={styles.itemsSummary} numberOfLines={1}>
              {item.items.map((i) => i.name_en).join(', ')}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.status}>{ORDER_STATUS_LABELS[item.orderStatus]?.[language] ?? item.orderStatus}</Text>
              <Text style={styles.total}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 20, fontWeight: '800', color: COLORS.text, paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontWeight: '700', color: COLORS.text },
  date: { color: COLORS.textMuted, fontSize: 12 },
  itemsSummary: { color: COLORS.textMuted, fontSize: 13, marginTop: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  status: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  total: { fontWeight: '800', color: COLORS.text },
});
