import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, DEFAULT_SHOP_ID, type Category } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import { addCategory, updateCategory, deleteCategory } from '../services/firestoreService';

const PLACEHOLDER_ICON = 'https://picsum.photos/seed/category/120/120';

export function ManageCategoriesScreen() {
  const { t } = useTranslation();
  const categories = useCatalogStore((s) => s.categories);
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setNameEn('');
    setNameHi('');
    setEditingId(null);
  }

  async function handleSave() {
    if (!nameEn.trim()) return;
    if (editingId) {
      await updateCategory(editingId, { name_en: nameEn.trim(), name_hi: nameHi.trim() });
    } else {
      await addCategory({
        shopId: DEFAULT_SHOP_ID,
        name_en: nameEn.trim(),
        name_hi: nameHi.trim(),
        icon: PLACEHOLDER_ICON,
        sortOrder: categories.length,
      });
    }
    resetForm();
  }

  function handleEdit(category: Category) {
    setEditingId(category.id);
    setNameEn(category.name_en);
    setNameHi(category.name_hi);
  }

  function handleDelete(category: Category) {
    Alert.alert(t('common.delete'), category.name_en, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCategory(category.id) },
    ]);
  }

  function move(category: Category, direction: -1 | 1) {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((c) => c.id === category.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    updateCategory(category.id, { sortOrder: swapWith.sortOrder });
    updateCategory(swapWith.id, { sortOrder: category.sortOrder });
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('owner.productNameEn').replace('Product ', '')}
              placeholderTextColor={COLORS.textMuted}
              value={nameEn}
              onChangeText={setNameEn}
            />
            <TextInput
              style={styles.input}
              placeholder={t('owner.productNameHi').replace('Product ', '')}
              placeholderTextColor={COLORS.textMuted}
              value={nameHi}
              onChangeText={setNameHi}
            />
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{editingId ? t('common.save') : t('owner.addCategory')}</Text>
            </Pressable>
            {editingId && (
              <Pressable onPress={resetForm}>
                <Text style={styles.cancelEdit}>{t('common.cancel')}</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryName}>{item.name_en}</Text>
              {item.name_hi ? <Text style={styles.categoryNameHi}>{item.name_hi}</Text> : null}
            </View>
            <Pressable style={styles.iconButton} onPress={() => move(item, -1)}>
              <Text style={styles.iconButtonText}>↑</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => move(item, 1)}>
              <Text style={styles.iconButtonText}>↓</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => handleEdit(item)}>
              <Text style={styles.iconButtonText}>✎</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => handleDelete(item)}>
              <Text style={[styles.iconButtonText, { color: COLORS.danger }]}>✕</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  form: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.text,
  },
  saveButton: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700' },
  cancelEdit: { textAlign: 'center', marginTop: 8, color: COLORS.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  categoryName: { fontWeight: '700', color: COLORS.text },
  categoryNameHi: { color: COLORS.textMuted, fontSize: 12 },
  iconButton: { paddingHorizontal: 8 },
  iconButtonText: { fontSize: 16, color: COLORS.textMuted },
});
