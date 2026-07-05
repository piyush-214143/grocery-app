import { useMemo } from 'react';
import { View, Text, FlatList, Pressable, Switch, StyleSheet, SectionList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, UNIT_LABELS, formatCurrency, type Product } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { updateProduct } from '../services/firestoreService';
import type { RootStackParamList } from '../navigation/types';

export function ManageProductsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const categories = useCatalogStore((s) => s.categories);
  const products = useCatalogStore((s) => s.products);

  const sections = useMemo(
    () =>
      categories
        .map((cat) => ({
          title: cat.name_en,
          data: products.filter((p) => p.categoryId === cat.id),
        }))
        .filter((section) => section.data.length > 0),
    [categories, products]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('owner.manageProducts')}</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.headerButton} onPress={() => navigation.navigate('ManageCategories')}>
            <Text style={styles.headerButtonText}>{t('owner.manageCategories')}</Text>
          </Pressable>
          <Pressable style={[styles.headerButton, styles.addButton]} onPress={() => navigation.navigate('ProductForm', {})}>
            <Text style={[styles.headerButtonText, { color: '#fff' }]}>+ {t('owner.addProduct')}</Text>
          </Pressable>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.navigate('ProductForm', { productId: item.id })}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name_en}
              </Text>
              <Text style={styles.productPrice}>
                {formatCurrency(item.price)} / {UNIT_LABELS[item.unit]}
              </Text>
            </View>
            <Switch
              value={item.isAvailable}
              onValueChange={(value) => updateProduct(item.id, { isAvailable: value })}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
            />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  headerButtons: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  headerButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
  addButton: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  headerButtonText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  list: { padding: 16, paddingTop: 4 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted, marginTop: 12, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  image: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.background },
  productName: { fontWeight: '700', color: COLORS.text },
  productPrice: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
