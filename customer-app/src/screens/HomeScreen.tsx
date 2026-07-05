import { useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { CategoryCard } from '../components/CategoryCard';
import { ProductCard } from '../components/ProductCard';
import { CartBar } from '../components/CartBar';
import type { RootStackParamList } from '../navigation/types';

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const shop = useCatalogStore((s) => s.shop);
  const categories = useCatalogStore((s) => s.categories);
  const products = useCatalogStore((s) => s.products);

  const featured = useMemo(() => products.filter((p) => p.isFeatured), [products]);
  const dailyItems = useMemo(() => products.filter((p) => p.isDailyItem).slice(0, 8), [products]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{shop?.shopName ?? t('common.appNameCustomer')}</Text>
            {shop && (
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: shop.isOpen ? COLORS.success : COLORS.danger }]} />
                <Text style={styles.statusText}>{shop.isOpen ? t('home.shopOpen') : t('home.shopClosed')}</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
          <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        </Pressable>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>🥦 Fresh produce, delivered from your local store</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onPress={() =>
                navigation.navigate('CategoryProducts', { categoryId: item.id, categoryName: item.name_en })
              }
            />
          )}
        />

        {dailyItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('home.dailyEssentials')}</Text>
            <FlatList
              data={dailyItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <View style={{ marginRight: 10 }}>
                  <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
                </View>
              )}
            />
          </>
        )}

        {featured.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('home.featured')}</Text>
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <View style={{ marginRight: 10 }}>
                  <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
                </View>
              )}
            />
          </>
        )}
      </ScrollView>
      <CartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  shopName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchPlaceholder: { color: COLORS.textMuted, fontSize: 14 },
  banner: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#E9F9EE',
    borderRadius: 12,
    padding: 16,
  },
  bannerText: { color: COLORS.primaryDark, fontWeight: '600' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  horizontalList: { paddingHorizontal: 16 },
});
