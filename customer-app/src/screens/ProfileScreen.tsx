import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { COLORS } from '@grocery/shared';
import { auth } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';

export function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  function handleLogout() {
    Alert.alert(t('common.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => signOut(auth) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.header}>{t('profile.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.phone}>{profile?.phone}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('profile.savedAddresses')}</Text>
      {(profile?.addresses ?? []).length === 0 ? (
        <Text style={styles.muted}>—</Text>
      ) : (
        profile!.addresses.map((addr, i) => (
          <View key={i} style={styles.addressRow}>
            <Text style={styles.addressLabel}>{addr.label}</Text>
            <Text style={styles.addressText}>{addr.fullAddress}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>{t('common.language')}</Text>
      <View style={styles.langRow}>
        <Pressable
          style={[styles.langOption, language === 'en' && styles.langOptionActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
        </Pressable>
        <Pressable
          style={[styles.langOption, language === 'hi' && styles.langOptionActive]}
          onPress={() => setLanguage('hi')}
        >
          <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>हिन्दी</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('common.logout')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  phone: { color: COLORS.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  muted: { color: COLORS.textMuted, marginBottom: 16 },
  addressRow: { marginBottom: 10 },
  addressLabel: { fontWeight: '700', color: COLORS.text },
  addressText: { color: COLORS.textMuted },
  langRow: { flexDirection: 'row', gap: 10, marginBottom: 24, marginTop: 4 },
  langOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  langOptionActive: { borderColor: COLORS.primary, backgroundColor: '#E9F9EE' },
  langText: { fontWeight: '600', color: COLORS.textMuted },
  langTextActive: { color: COLORS.primary },
  logoutButton: {
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: COLORS.danger, fontWeight: '700' },
});
