import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { COLORS, UNIT_LABELS, formatCurrency, localize, type Product } from '@grocery/shared';
import { useCartStore } from '../store/useCartStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { QuantityStepper } from './QuantityStepper';

interface Props {
  product: Product;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: Props) {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const qty = useCartStore((s) => s.qtyOf(product.id));
  const addItem = useCartStore((s) => s.addItem);
  const increment = useCartStore((s) => s.incrementQty);
  const decrement = useCartStore((s) => s.decrementQty);

  const name = localize(language, product.name_en, product.name_hi);
  const unavailable = !product.isAvailable || (product.stockQty !== undefined && product.stockQty <= 0);

  return (
    <Pressable onPress={onPress} style={[styles.card, unavailable && styles.unavailableCard]}>
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={150}
      />
      {unavailable && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>{t('product.outOfStock')}</Text>
        </View>
      )}
      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
      <Text style={styles.priceRow}>
        {formatCurrency(product.price)}
        <Text style={styles.unit}> / {UNIT_LABELS[product.unit]}</Text>
      </Text>

      {unavailable ? (
        <View style={[styles.addButton, styles.addButtonDisabled]}>
          <Text style={styles.addButtonText}>{t('product.addToCart')}</Text>
        </View>
      ) : qty === 0 ? (
        <Pressable onPress={() => addItem(product)} style={styles.addButton}>
          <Text style={styles.addButtonText}>{t('product.addToCart')}</Text>
        </Pressable>
      ) : (
        <QuantityStepper
          qty={qty}
          size="small"
          onIncrement={() => increment(product.id)}
          onDecrement={() => decrement(product.id)}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unavailableCard: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginBottom: 6,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    minHeight: 34,
  },
  priceRow: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 6,
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
