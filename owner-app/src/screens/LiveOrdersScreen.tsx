import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, ORDER_STATUS_LABELS, formatCurrency, formatDateTime, type OrderStatus } from '@grocery/shared';
import { useOrdersStore } from '../store/useOrdersStore';
import type { RootStackParamList } from '../navigation/types';

type StatusFilter = 'active' | OrderStatus | 'all';
type DateFilter = 'today' | 'week' | 'all';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'accepted', 'packed', 'out_for_delivery'];

function withinDateFilter(epochMs: number, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  const now = Date.now();
  const days = filter === 'today' ? 1 : 7;
  return now - epochMs <= days * 24 * 60 * 60 * 1000;
}

export function LiveOrdersScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const orders = useOrdersStore((s) => s.orders);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const statusOk =
        statusFilter === 'all' ? true : statusFilter === 'active' ? ACTIVE_STATUSES.includes(o.orderStatus) : o.orderStatus === statusFilter;
      return statusOk && withinDateFilter(o.placedAt, dateFilter);
    });
  }, [orders, statusFilter, dateFilter]);

  const totals = useMemo(() => {
    const revenue = filtered.filter((o) => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
    return { count: filtered.length, revenue };
  }, [filtered]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.header}>{t('owner.liveOrders')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.chip, statusFilter === f.key && styles.chipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
        <View style={styles.chipDivider} />
        {(['today', 'week', 'all'] as DateFilter[]).map((d) => (
          <Pressable key={d} style={[styles.chip, dateFilter === d && styles.chipActive]} onPress={() => setDateFilter(d)}>
            <Text style={[styles.chipText, dateFilter === d && styles.chipTextActive]}>
              {d === 'today' ? 'Today' : d === 'week' ? '7 days' : 'All time'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.totalsBar}>
        <Text style={styles.totalsText}>{totals.count} orders</Text>
        <Text style={styles.totalsText}>{formatCurrency(totals.revenue)}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No orders match this filter.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.date}>{formatDateTime(item.placedAt)}</Text>
            </View>
            <Text style={styles.itemsSummary} numberOfLines={1}>
              {item.items.map((i) => `${i.name_en} x${i.qty}`).join(', ')}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.status, item.orderStatus === 'placed' && styles.statusNew]}>
                {ORDER_STATUS_LABELS[item.orderStatus]?.en ?? item.orderStatus}
              </Text>
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
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  chipTextActive: { color: '#fff' },
  chipDivider: { width: 1, height: 20, backgroundColor: COLORS.border, marginRight: 8 },
  totalsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  totalsText: { fontWeight: '700', color: COLORS.text, fontSize: 13 },
  list: { padding: 16, paddingTop: 4 },
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
  customerName: { fontWeight: '700', color: COLORS.text },
  date: { color: COLORS.textMuted, fontSize: 12 },
  itemsSummary: { color: COLORS.textMuted, fontSize: 13, marginTop: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  status: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  statusNew: { color: COLORS.danger },
  total: { fontWeight: '800', color: COLORS.text },
});
