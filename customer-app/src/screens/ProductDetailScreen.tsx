import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS, UNIT_LABELS, formatCurrency, localize } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { useCartStore } from '../store/useCartStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { QuantityStepper } from '../components/QuantityStepper';
import type { RootStackParamList } from '../navigation/types';

export function ProductDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const language = useLanguageStore((s) => s.language);
  const product = useCatalogStore((s) => s.products.find((p) => p.id === route.params.productId));
  const qty = useCartStore((s) => (product ? s.qtyOf(product.id) : 0));
  const addItem = useCartStore((s) => s.addItem);
  const increment = useCartStore((s) => s.incrementQty);
  const decrement = useCartStore((s) => s.decrementQty);

  const unavailable = useMemo(
    () => !product || !product.isAvailable || (product.stockQty !== undefined && product.stockQty <= 0),
    [product]
  );

  if (!product) return null;

  const name = localize(language, product.name_en, product.name_hi);
  const description = localize(language, product.description_en, product.description_hi);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <Image source={{ uri: product.imageUrl }} style={styles.image} contentFit="cover" />
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.price}>
            {formatCurrency(product.price)}
            <Text style={styles.unit}> / {UNIT_LABELS[product.unit]}</Text>
          </Text>
          {description ? (
            <>
              <Text style={styles.sectionLabel}>{t('product.description')}</Text>
              <Text style={styles.description}>{description}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {unavailable ? (
          <View style={[styles.addButton, styles.addButtonDisabled]}>
            <Text style={styles.addButtonText}>{t('product.outOfStock')}</Text>
          </View>
        ) : qty === 0 ? (
          <Pressable style={styles.addButton} onPress={() => addItem(product)}>
            <Text style={styles.addButtonText}>{t('product.addToCart')}</Text>
          </Pressable>
        ) : (
          <QuantityStepper qty={qty} onIncrement={() => increment(product.id)} onDecrement={() => decrement(product.id)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  image: { width: '100%', height: 280, backgroundColor: COLORS.background },
  content: { padding: 16 },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  price: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  unit: { fontSize: 14, fontWeight: '400', color: COLORS.textMuted },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 6 },
  description: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonDisabled: { backgroundColor: COLORS.border },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
