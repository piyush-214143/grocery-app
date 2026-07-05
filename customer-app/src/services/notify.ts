import { sendPushNotification, formatCurrency, type Shop } from '@grocery/shared';

export function notifyOwnerOfNewOrder(shop: Shop | null, customerName: string, amount: number) {
  if (!shop?.ownerFcmToken) return;
  sendPushNotification({
    to: shop.ownerFcmToken,
    title: 'New order received!',
    body: `${customerName} just placed an order for ${formatCurrency(amount)}.`,
    data: { type: 'new_order' },
  });
}
