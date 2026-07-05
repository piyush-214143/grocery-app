import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS, buildTelLink, buildWhatsappLink } from '@grocery/shared';
import { useCatalogStore } from '../store/useCatalogStore';
import type { RootStackParamList, MainTabsParamList } from '../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>,
  BottomTabNavigationProp<MainTabsParamList>
>;

export function OrderConfirmationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>();
  const shop = useCatalogStore((s) => s.shop);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{t('orderConfirmation.title')}</Text>
        <Text style={styles.thankYou}>{t('orderConfirmation.thankYou')}</Text>

        <View style={styles.orderIdBox}>
          <Text style={styles.orderIdLabel}>{t('orderConfirmation.orderId')}</Text>
          <Text style={styles.orderIdValue}>{route.params.orderId}</Text>
        </View>

        {shop && (
          <View style={styles.contactRow}>
            <Pressable style={styles.contactButton} onPress={() => Linking.openURL(buildTelLink(shop.ownerPhone))}>
              <Text style={styles.contactButtonText}>{t('orderConfirmation.callShop')}</Text>
            </Pressable>
            <Pressable
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={() => Linking.openURL(buildWhatsappLink(shop.ownerWhatsapp))}
            >
              <Text style={styles.contactButtonText}>{t('orderConfirmation.whatsappShop')}</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={styles.viewOrdersButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' } as never)}
        >
          <Text style={styles.viewOrdersText}>{t('orderConfirmation.viewOrders')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  thankYou: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  orderIdBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  orderIdLabel: { fontSize: 12, color: COLORS.textMuted },
  orderIdValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  contactRow: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  contactButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  whatsappButton: { backgroundColor: '#25D366' },
  contactButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  viewOrdersButton: { marginTop: 28, paddingVertical: 12 },
  viewOrdersText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
});
