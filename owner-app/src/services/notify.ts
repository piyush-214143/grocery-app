import { sendPushNotification, ORDER_STATUS_LABELS, type Order } from '@grocery/shared';
import { getUserFcmToken } from './firestoreService';

export async function notifyCustomerOfStatusChange(order: Order) {
  const token = await getUserFcmToken(order.userId).catch(() => undefined);
  if (!token) return;
  const statusLabel = ORDER_STATUS_LABELS[order.orderStatus]?.en ?? order.orderStatus;
  sendPushNotification({
    to: token,
    title: 'Order update',
    body: `Your order #${order.id.slice(-6).toUpperCase()} is now: ${statusLabel}`,
    data: { type: 'order_status', orderId: order.id },
  });
}
