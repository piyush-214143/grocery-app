import { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { ProductCard } from '../components/ProductCard';
import { CartBar } from '../components/CartBar';
import type { RootStackParamList } from '../navigation/types';

export function CategoryProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CategoryProducts'>>();
  const products = useCatalogStore((s) => s.products);

  const categoryProducts = useMemo(
    () => products.filter((p) => p.categoryId === route.params.categoryId),
    [products, route.params.categoryId]
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={categoryProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
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
  list: { padding: 12, paddingBottom: 90 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
});
