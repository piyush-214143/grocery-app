import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@grocery/shared';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LiveOrdersScreen } from '../screens/LiveOrdersScreen';
import { ManageProductsScreen } from '../screens/ManageProductsScreen';
import { ShopSettingsScreen } from '../screens/ShopSettingsScreen';
import type { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const ICONS: Record<keyof MainTabsParamList, string> = {
  Dashboard: '📊',
  LiveOrders: '🧾',
  Products: '🛒',
  Settings: '⚙️',
};

export function MainTabsNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name as keyof MainTabsParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('owner.dashboard') }} />
      <Tab.Screen name="LiveOrders" component={LiveOrdersScreen} options={{ title: t('owner.liveOrders') }} />
      <Tab.Screen name="Products" component={ManageProductsScreen} options={{ title: t('owner.manageProducts') }} />
      <Tab.Screen name="Settings" component={ShopSettingsScreen} options={{ title: t('owner.shopSettings') }} />
    </Tab.Navigator>
  );
}
