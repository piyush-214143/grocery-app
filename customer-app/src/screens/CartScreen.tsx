import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, UNIT_LABELS, formatCurrency, localize, type CartLine } from '@grocery/shared';
import { useCartStore } from '../store/useCartStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { QuantityStepper } from '../components/QuantityStepper';
import type { RootStackParamList } from '../navigation/types';

export function CartScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const language = useLanguageStore((s) => s.language);
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const increment = useCartStore((s) => s.incrementQty);
  const decrement = useCartStore((s) => s.decrementQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const shop = useCatalogStore((s) => s.shop);

  const minOrder = shop?.minOrderAmount ?? 0;
  const belowMinimum = subtotal > 0 && subtotal < minOrder;
  const canCheckout = lines.length > 0 && !belowMinimum && shop?.isOpen !== false;

  function renderLine({ item }: { item: CartLine }) {
    const name = localize(language, item.product.name_en, item.product.name_hi);
    return (
      <View style={styles.line}>
        <Image source={{ uri: item.product.imageUrl }} style={styles.image} contentFit="cover" />
        <View style={styles.lineInfo}>
          <Text numberOfLines={2} style={styles.lineName}>{name}</Text>
          <Text style={styles.linePrice}>
            {formatCurrency(item.product.price)} / {UNIT_LABELS[item.product.unit]}
          </Text>
          <Pressable onPress={() => removeItem(item.product.id)}>
            <Text style={styles.remove}>{t('cart.remove')}</Text>
          </Pressable>
        </View>
        <QuantityStepper
          qty={item.qty}
          size="small"
          onIncrement={() => increment(item.product.id)}
          onDecrement={() => decrement(item.product.id)}
        />
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={lines}
        keyExtractor={(item) => item.product.id}
        renderItem={renderLine}
        contentContainerStyle={{ padding: 16 }}
      />
      <View style={styles.footer}>
        {!shop?.isOpen && (
          <Text style={styles.warning}>{t('home.shopClosed')}</Text>
        )}
        {belowMinimum && (
          <Text style={styles.warning}>
            {t('cart.minOrderWarning', { amount: formatCurrency(minOrder - subtotal) })}
          </Text>
        )}
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>{t('cart.subtotal')}</Text>
          <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <Pressable
          style={[styles.checkoutButton, !canCheckout && styles.checkoutButtonDisabled]}
          disabled={!canCheckout}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>{t('cart.proceedToOrder')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  line: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: { width: 56, height: 56, borderRadius: 8, backgroundColor: COLORS.background },
  lineInfo: { flex: 1, marginHorizontal: 10 },
  lineName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  linePrice: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  remove: { fontSize: 12, color: COLORS.danger, fontWeight: '600', marginTop: 4 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  warning: { color: COLORS.warning, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subtotalLabel: { fontSize: 15, color: COLORS.textMuted },
  subtotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  checkoutButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  checkoutButtonDisabled: { backgroundColor: COLORS.border },
  checkoutButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
