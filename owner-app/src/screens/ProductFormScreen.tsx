import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, DEFAULT_SHOP_ID, type ProductUnit } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { addProduct, updateProduct, deleteProduct } from '../services/firestoreService';
import type { RootStackParamList } from '../navigation/types';

const UNITS: ProductUnit[] = ['kg', 'litre', 'pack', 'piece', 'dozen'];
const placeholderFor = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

export function ProductFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductForm'>>();
  const categories = useCatalogStore((s) => s.categories);
  const products = useCatalogStore((s) => s.products);
  const existing = products.find((p) => p.id === route.params.productId);

  const [nameEn, setNameEn] = useState(existing?.name_en ?? '');
  const [nameHi, setNameHi] = useState(existing?.name_hi ?? '');
  const [descEn, setDescEn] = useState(existing?.description_en ?? '');
  const [descHi, setDescHi] = useState(existing?.description_hi ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [unit, setUnit] = useState<ProductUnit>(existing?.unit ?? 'kg');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? '');
  const [imageUri, setImageUri] = useState(existing?.imageUrl ?? placeholderFor(route.params.productId ?? 'new-product'));
  const [isAvailable, setIsAvailable] = useState(existing?.isAvailable ?? true);
  const [isDailyItem, setIsDailyItem] = useState(existing?.isDailyItem ?? false);
  const [isFeatured, setIsFeatured] = useState(existing?.isFeatured ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: existing ? t('common.edit') : t('owner.addProduct') });
  }, [existing]);

  // Real photo upload needs Firebase Storage, which (since Feb 2026) requires
  // the Blaze plan to provision a bucket at all. Until this project is on
  // Blaze, "uploading" just cycles to a different picsum.photos placeholder
  // -- see uploadProductImage() in firestoreService.ts for the real upload
  // path, ready to wire back in once Storage is enabled.
  function shufflePlaceholder() {
    setImageUri(placeholderFor(`${nameEn || 'product'}-${Date.now()}`));
  }

  async function handleSave() {
    if (!nameEn.trim() || !price.trim() || !categoryId) {
      Alert.alert('', 'Name, price, and category are required.');
      return;
    }
    setSaving(true);
    try {
      const now = Date.now();
      const payload = {
        shopId: DEFAULT_SHOP_ID,
        categoryId,
        name_en: nameEn.trim(),
        name_hi: nameHi.trim(),
        description_en: descEn.trim(),
        description_hi: descHi.trim(),
        price: parseFloat(price),
        unit,
        imageUrl: imageUri,
        isAvailable,
        isDailyItem,
        isFeatured,
        updatedAt: now,
      };

      if (existing) {
        await updateProduct(existing.id, payload);
      } else {
        await addProduct({ ...payload, createdAt: now });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save product', err.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert(t('common.delete'), nameEn, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(existing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={shufflePlaceholder} style={styles.imagePicker}>
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
          <Text style={styles.imagePickerText}>Try another placeholder image</Text>
        </Pressable>

        <TextInput style={styles.input} placeholder={t('owner.productNameEn')} placeholderTextColor={COLORS.textMuted} value={nameEn} onChangeText={setNameEn} />
        <TextInput style={styles.input} placeholder={t('owner.productNameHi')} placeholderTextColor={COLORS.textMuted} value={nameHi} onChangeText={setNameHi} />
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder={t('owner.descriptionEn')}
          placeholderTextColor={COLORS.textMuted}
          multiline
          value={descEn}
          onChangeText={setDescEn}
        />
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder={t('owner.descriptionHi')}
          placeholderTextColor={COLORS.textMuted}
          multiline
          value={descHi}
          onChangeText={setDescHi}
        />
        <TextInput
          style={styles.input}
          placeholder={t('owner.price')}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.label}>{t('owner.unit')}</Text>
        <View style={styles.chipRow}>
          {UNITS.map((u) => (
            <Pressable key={u} style={[styles.chip, unit === u && styles.chipActive]} onPress={() => setUnit(u)}>
              <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('owner.category')}</Text>
        <View style={styles.chipRow}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name_en}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('owner.available')}</Text>
          <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: COLORS.primary, false: COLORS.border }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('owner.dailyItem')}</Text>
          <Switch value={isDailyItem} onValueChange={setIsDailyItem} trackColor={{ true: COLORS.primary, false: COLORS.border }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('owner.featured')}</Text>
          <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ true: COLORS.primary, false: COLORS.border }} />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('common.save')}</Text>}
        </Pressable>

        {existing && (
          <Pressable onPress={handleDelete}>
            <Text style={styles.deleteLink}>{t('common.delete')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  imagePicker: { alignItems: 'center', marginBottom: 16 },
  image: { width: 120, height: 120, borderRadius: 12, backgroundColor: COLORS.surface },
  imagePickerText: { color: COLORS.accent, fontWeight: '700', marginTop: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    color: COLORS.text,
  },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  chipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { fontWeight: '600', color: COLORS.text },
  saveButton: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteLink: { color: COLORS.danger, textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
