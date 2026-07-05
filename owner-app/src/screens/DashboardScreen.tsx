import { useMemo } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, formatCurrency } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { useOrdersStore } from '../store/useOrdersStore';
import { saveShop } from '../services/firestoreService';

function isToday(epochMs: number): boolean {
  const d = new Date(epochMs);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const shop = useCatalogStore((s) => s.shop);
  const orders = useOrdersStore((s) => s.orders);

  const todayOrders = useMemo(() => orders.filter((o) => isToday(o.placedAt)), [orders]);
  const pendingOrders = useMemo(
    () => orders.filter((o) => !['delivered', 'cancelled'].includes(o.orderStatus)),
    [orders]
  );
  const todayRevenue = useMemo(
    () => todayOrders.filter((o) => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0),
    [todayOrders]
  );

  function toggleShopOpen(value: boolean) {
    if (!shop) return;
    saveShop({ ...shop, isOpen: value });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>{t('owner.dashboard')}</Text>

        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusTitle}>{t('owner.shopStatus')}</Text>
            <Text style={styles.statusSubtitle}>{shop?.isOpen ? t('owner.openForOrders') : t('owner.closed')}</Text>
          </View>
          <Switch
            value={shop?.isOpen ?? false}
            onValueChange={toggleShopOpen}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayOrders.length}</Text>
            <Text style={styles.statLabel}>{t('owner.todayOrders')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingOrders.length}</Text>
            <Text style={styles.statLabel}>{t('owner.pendingOrders')}</Text>
          </View>
        </View>

        <View style={styles.revenueCard}>
          <Text style={styles.statLabel}>{t('owner.todayRevenue')}</Text>
          <Text style={styles.revenueValue}>{formatCurrency(todayRevenue)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: { fontWeight: '700', color: COLORS.text },
  statusSubtitle: { color: COLORS.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800', color: COLORS.accent },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  revenueCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  revenueValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginTop: 6 },
});
