import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  UNIT_LABELS,
  buildTelLink,
  buildWhatsappLink,
  formatCurrency,
  formatDateTime,
  type Order,
  type OrderStatus,
} from '@grocery/shared';
import { subscribeToOrder, updateOrderStatus } from '../services/firestoreService';
import { notifyCustomerOfStatusChange } from '../services/notify';
import type { RootStackParamList } from '../navigation/types';

const NEXT_ACTION_LABEL: Record<OrderStatus, string | null> = {
  placed: 'acceptOrder',
  accepted: 'markPacked',
  packed: 'markOutForDelivery',
  out_for_delivery: 'markDelivered',
  delivered: null,
  cancelled: null,
};

export function OrderDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const [order, setOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => subscribeToOrder(route.params.orderId, setOrder), [route.params.orderId]);

  if (!order) return null;

  async function advanceStatus() {
    if (!order) return;
    const currentIndex = ORDER_STATUS_FLOW.indexOf(order.orderStatus);
    const next = ORDER_STATUS_FLOW[currentIndex + 1];
    if (!next) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, next);
      notifyCustomerOfStatusChange({ ...order, orderStatus: next });
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel() {
    if (!order || !cancelReason.trim()) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'cancelled', cancelReason.trim());
      notifyCustomerOfStatusChange({ ...order, orderStatus: 'cancelled' });
      setShowCancelForm(false);
    } finally {
      setUpdating(false);
    }
  }

  const nextActionKey = NEXT_ACTION_LABEL[order.orderStatus];
  const isFinal = order.orderStatus === 'delivered' || order.orderStatus === 'cancelled';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.date}>{formatDateTime(order.placedAt)}</Text>
        <Text style={styles.currentStatus}>{ORDER_STATUS_LABELS[order.orderStatus]?.en ?? order.orderStatus}</Text>

        <View style={styles.contactCard}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.address}>{order.deliveryAddress.fullAddress}</Text>
          <View style={styles.contactRow}>
            <Pressable style={styles.contactButton} onPress={() => Linking.openURL(buildTelLink(order.customerPhone))}>
              <Text style={styles.contactButtonText}>{t('common.call')}</Text>
            </Pressable>
            <Pressable
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={() => Linking.openURL(buildWhatsappLink(order.customerPhone))}
            >
              <Text style={styles.contactButtonText}>{t('common.whatsapp')}</Text>
            </Pressable>
          </View>
        </View>

        {order.customerNote ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Note from customer</Text>
            <Text style={styles.noteText}>{order.customerNote}</Text>
          </View>
        ) : null}

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
        <Text style={styles.paymentInfo}>
          {order.paymentMode} · {order.paymentStatus}
        </Text>

        {order.orderStatus === 'cancelled' && order.cancelReason ? (
          <Text style={styles.cancelReasonText}>Cancelled: {order.cancelReason}</Text>
        ) : null}

        {!isFinal && (
          <>
            {nextActionKey && (
              <Pressable style={styles.primaryButton} onPress={advanceStatus} disabled={updating}>
                <Text style={styles.primaryButtonText}>{t(`owner.${nextActionKey}`)}</Text>
              </Pressable>
            )}

            {!showCancelForm ? (
              <Pressable onPress={() => setShowCancelForm(true)}>
                <Text style={styles.cancelLink}>{t('owner.cancelOrder')}</Text>
              </Pressable>
            ) : (
              <View style={styles.cancelForm}>
                <TextInput
                  style={styles.input}
                  placeholder={t('owner.cancelReason')}
                  placeholderTextColor={COLORS.textMuted}
                  value={cancelReason}
                  onChangeText={setCancelReason}
                />
                <Pressable style={styles.cancelConfirmButton} onPress={handleCancel} disabled={updating}>
                  <Text style={styles.primaryButtonText}>{t('owner.cancelOrder')}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  orderId: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  date: { color: COLORS.textMuted, marginTop: 2 },
  currentStatus: { color: COLORS.accent, fontWeight: '700', fontSize: 15, marginTop: 8, marginBottom: 16 },
  contactCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  customerName: { fontWeight: '700', fontSize: 16, color: COLORS.text },
  address: { color: COLORS.textMuted, marginTop: 4 },
  contactRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  contactButton: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  whatsappButton: { backgroundColor: '#25D366' },
  contactButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  noteBox: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 16 },
  noteLabel: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  noteText: { color: COLORS.text, marginTop: 4 },
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
  paymentInfo: { marginTop: 4, color: COLORS.textMuted, fontWeight: '600' },
  cancelReasonText: { marginTop: 12, color: COLORS.danger, fontWeight: '600' },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink: { color: COLORS.danger, textAlign: 'center', marginTop: 16, fontWeight: '600' },
  cancelForm: { marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.text,
  },
  cancelConfirmButton: { backgroundColor: COLORS.danger, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});
