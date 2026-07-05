import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  DEFAULT_SHOP_ID,
  buildUpiLink,
  formatCurrency,
  type Address,
  type PaymentMode,
  type OrderItem,
} from '@grocery/shared';
import { useCartStore } from '../store/useCartStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useAuthStore } from '../store/useAuthStore';
import { placeOrder, saveUserProfile } from '../services/firestoreService';
import { notifyOwnerOfNewOrder } from '../services/notify';
import type { RootStackParamList } from '../navigation/types';

export function CheckoutScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);
  const shop = useCatalogStore((s) => s.shop);
  const { profile, firebaseUser } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>(profile?.addresses ?? []);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(addresses.length > 0 ? 0 : -1);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('COD');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);

  async function handleAddAddress() {
    if (!newAddressText.trim()) return;
    const address: Address = {
      label: newAddressLabel.trim() || 'Home',
      fullAddress: newAddressText.trim(),
    };
    const updated = [...addresses, address];
    setAddresses(updated);
    setSelectedAddressIndex(updated.length - 1);
    setAddingAddress(false);
    setNewAddressLabel('');
    setNewAddressText('');
    if (profile) {
      await saveUserProfile({ ...profile, addresses: updated });
    }
  }

  async function handlePlaceOrder() {
    if (!firebaseUser || !profile) return;
    if (selectedAddressIndex < 0) {
      Alert.alert('', t('checkout.addAddress'));
      return;
    }
    const deliveryAddress = addresses[selectedAddressIndex];
    const items: OrderItem[] = lines.map((l) => ({
      productId: l.product.id,
      name_en: l.product.name_en,
      name_hi: l.product.name_hi,
      price: l.product.price,
      qty: l.qty,
      unit: l.product.unit,
    }));

    setPlacing(true);
    try {
      const now = Date.now();
      const orderId = await placeOrder({
        shopId: DEFAULT_SHOP_ID,
        userId: firebaseUser.uid,
        customerName: profile.name,
        customerPhone: profile.phone,
        items,
        totalAmount: subtotal,
        deliveryAddress,
        paymentMode,
        paymentStatus: 'pending',
        orderStatus: 'placed',
        placedAt: now,
        statusUpdatedAt: now,
        customerNote: note.trim() || undefined,
      });

      notifyOwnerOfNewOrder(shop, profile.name, subtotal);

      if (paymentMode === 'UPI' && shop?.upiId) {
        const upiLink = buildUpiLink({
          payeeVpa: shop.upiId,
          payeeName: shop.shopName,
          amount: subtotal,
          transactionNote: `Order ${orderId}`,
          transactionRef: orderId,
        });
        Linking.openURL(upiLink).catch(() => {
          Alert.alert('', 'Could not open a UPI app. You can still pay via Cash on Delivery.');
        });
      }

      clearCart();
      navigation.replace('OrderConfirmation', { orderId });
    } catch (err: any) {
      Alert.alert('Could not place order', err.message ?? 'Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>{t('checkout.deliveryAddress')}</Text>
        {addresses.map((addr, index) => (
          <Pressable
            key={index}
            style={[styles.addressCard, selectedAddressIndex === index && styles.addressCardSelected]}
            onPress={() => setSelectedAddressIndex(index)}
          >
            <Text style={styles.addressLabel}>{addr.label}</Text>
            <Text style={styles.addressText}>{addr.fullAddress}</Text>
          </Pressable>
        ))}

        {addingAddress ? (
          <View style={styles.addAddressForm}>
            <TextInput
              style={styles.input}
              placeholder="Label (Home, Work...)"
              placeholderTextColor={COLORS.textMuted}
              value={newAddressLabel}
              onChangeText={setNewAddressLabel}
            />
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Full address"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={newAddressText}
              onChangeText={setNewAddressText}
            />
            <Pressable style={styles.addAddressButton} onPress={handleAddAddress}>
              <Text style={styles.addAddressButtonText}>{t('common.save')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setAddingAddress(true)}>
            <Text style={styles.link}>+ {t('checkout.addAddress')}</Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>{t('checkout.paymentMode')}</Text>
        <Pressable
          style={[styles.paymentOption, paymentMode === 'COD' && styles.paymentOptionSelected]}
          onPress={() => setPaymentMode('COD')}
        >
          <Text style={styles.paymentOptionText}>{t('checkout.cod')}</Text>
        </Pressable>
        <Pressable
          style={[styles.paymentOption, paymentMode === 'UPI' && styles.paymentOptionSelected]}
          onPress={() => setPaymentMode('UPI')}
        >
          <Text style={styles.paymentOptionText}>{t('checkout.upi')}</Text>
          {paymentMode === 'UPI' && <Text style={styles.paymentHint}>{t('checkout.payWithUpiApp')}</Text>}
        </Pressable>

        <Text style={styles.sectionTitle}>{t('checkout.noteToShop')}</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder={t('checkout.notePlaceholder')}
          placeholderTextColor={COLORS.textMuted}
          multiline
          value={note}
          onChangeText={setNote}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>{t('cart.subtotal')}</Text>
          <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <Pressable style={styles.placeOrderButton} onPress={handlePlaceOrder} disabled={placing}>
          {placing ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeOrderText}>{t('checkout.placeOrder')}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  addressCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  addressCardSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  addressLabel: { fontWeight: '700', color: COLORS.text },
  addressText: { color: COLORS.textMuted, marginTop: 2 },
  addAddressForm: { marginTop: 4 },
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
  addAddressButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  addAddressButtonText: { color: '#fff', fontWeight: '700' },
  link: { color: COLORS.primary, fontWeight: '600', marginBottom: 8 },
  paymentOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  paymentOptionSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  paymentOptionText: { fontWeight: '600', color: COLORS.text },
  paymentHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subtotalLabel: { fontSize: 15, color: COLORS.textMuted },
  subtotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  placeOrderButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  placeOrderText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
