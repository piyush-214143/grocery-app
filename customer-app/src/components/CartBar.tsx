import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, formatCurrency } from '@grocery/shared';
import { useCartStore } from '../store/useCartStore';
import type { RootStackParamList } from '../navigation/types';

export function CartBar() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());

  if (itemCount === 0) return null;

  return (
    <Pressable style={styles.bar} onPress={() => navigation.navigate('Cart')}>
      <View>
        <Text style={styles.itemCount}>{itemCount} item{itemCount > 1 ? 's' : ''}</Text>
        <Text style={styles.subtotal}>{formatCurrency(subtotal)}</Text>
      </View>
      <Text style={styles.cta}>{t('cart.title')} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  itemCount: {
    color: '#E9F9EE',
    fontSize: 12,
  },
  subtotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cta: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
