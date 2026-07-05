import { useMemo, useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { ProductCard } from '../components/ProductCard';
import { CartBar } from '../components/CartBar';
import type { RootStackParamList } from '../navigation/types';

export function SearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const products = useCatalogStore((s) => s.products);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) => p.name_en.toLowerCase().includes(q) || (p.name_hi && p.name_hi.includes(query.trim()))
    );
  }, [products, query]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TextInput
        autoFocus
        style={styles.input}
        placeholder={t('home.searchPlaceholder')}
        placeholderTextColor={COLORS.textMuted}
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.trim().length > 0 ? <Text style={styles.empty}>No products found.</Text> : null
        }
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
        )}
      />
      <CartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  input: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  list: { paddingHorizontal: 12, paddingBottom: 90 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
});
