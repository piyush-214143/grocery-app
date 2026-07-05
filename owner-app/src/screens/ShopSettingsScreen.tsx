import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { COLORS, DEFAULT_SHOP_ID } from '@grocery/shared';
import { auth } from '../firebase';
import { useCatalogStore } from '../store/useCatalogStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { saveShop } from '../services/firestoreService';

export function ShopSettingsScreen() {
  const { t } = useTranslation();
  const shop = useCatalogStore((s) => s.shop);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState('3');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shop) return;
    setShopName(shop.shopName ?? '');
    setOwnerName(shop.ownerName ?? '');
    setOwnerPhone(shop.ownerPhone ?? '');
    setOwnerWhatsapp(shop.ownerWhatsapp ?? '');
    setAddress(shop.address ?? '');
    setUpiId(shop.upiId ?? '');
    setMinOrderAmount(String(shop.minOrderAmount ?? 0));
    setDeliveryRadiusKm(String(shop.deliveryRadiusKm ?? 3));
    setOpenTime(shop.openingHours?.open ?? '09:00');
    setCloseTime(shop.openingHours?.close ?? '21:00');
  }, [shop]);

  async function handleSave() {
    if (!shopName.trim() || !ownerPhone.trim() || !upiId.trim()) {
      Alert.alert('', 'Shop name, owner phone, and UPI ID are required.');
      return;
    }
    setSaving(true);
    try {
      await saveShop({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerWhatsapp: ownerWhatsapp.trim() || ownerPhone.trim(),
        address: address.trim(),
        upiId: upiId.trim(),
        isOpen: shop?.isOpen ?? true,
        deliveryRadiusKm: parseFloat(deliveryRadiusKm) || 0,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        openingHours: { open: openTime, close: closeTime },
        ownerFcmToken: shop?.ownerFcmToken,
      });
      Alert.alert('', 'Shop settings saved.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert(t('common.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => signOut(auth) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>{t('owner.shopSettings')}</Text>

        <TextInput style={styles.input} placeholder={t('owner.shopName')} placeholderTextColor={COLORS.textMuted} value={shopName} onChangeText={setShopName} />
        <TextInput style={styles.input} placeholder="Owner Name" placeholderTextColor={COLORS.textMuted} value={ownerName} onChangeText={setOwnerName} />
        <TextInput
          style={styles.input}
          placeholder={t('owner.ownerPhone')}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
          value={ownerPhone}
          onChangeText={setOwnerPhone}
        />
        <TextInput
          style={styles.input}
          placeholder={t('owner.ownerWhatsapp')}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
          value={ownerWhatsapp}
          onChangeText={setOwnerWhatsapp}
        />
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder={t('owner.address')}
          placeholderTextColor={COLORS.textMuted}
          multiline
          value={address}
          onChangeText={setAddress}
        />
        <TextInput style={styles.input} placeholder={t('owner.upiId')} placeholderTextColor={COLORS.textMuted} autoCapitalize="none" value={upiId} onChangeText={setUpiId} />
        <TextInput
          style={styles.input}
          placeholder={t('owner.minOrderAmount')}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          value={minOrderAmount}
          onChangeText={setMinOrderAmount}
        />
        <TextInput
          style={styles.input}
          placeholder={t('owner.deliveryRadius')}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          value={deliveryRadiusKm}
          onChangeText={setDeliveryRadiusKm}
        />

        <Text style={styles.label}>{t('owner.openingHours')}</Text>
        <View style={styles.hoursRow}>
          <TextInput style={[styles.input, styles.hoursInput]} placeholder="09:00" placeholderTextColor={COLORS.textMuted} value={openTime} onChangeText={setOpenTime} />
          <Text style={styles.hoursSeparator}>–</Text>
          <TextInput style={[styles.input, styles.hoursInput]} placeholder="21:00" placeholderTextColor={COLORS.textMuted} value={closeTime} onChangeText={setCloseTime} />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('common.save')}</Text>}
        </Pressable>

        <Text style={[styles.label, { marginTop: 24 }]}>{t('common.language')}</Text>
        <View style={styles.langRow}>
          <Pressable style={[styles.langOption, language === 'en' && styles.langOptionActive]} onPress={() => setLanguage('en')}>
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
          </Pressable>
          <Pressable style={[styles.langOption, language === 'hi' && styles.langOptionActive]} onPress={() => setLanguage('hi')}>
            <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>हिन्दी</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  header: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
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
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursInput: { flex: 1 },
  hoursSeparator: { color: COLORS.textMuted },
  saveButton: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  langRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  langOption: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  langOptionActive: { borderColor: COLORS.accent, backgroundColor: '#FFF3E0' },
  langText: { fontWeight: '600', color: COLORS.textMuted },
  langTextActive: { color: COLORS.accent },
  logoutButton: { borderWidth: 1, borderColor: COLORS.danger, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  logoutText: { color: COLORS.danger, fontWeight: '700' },
});
