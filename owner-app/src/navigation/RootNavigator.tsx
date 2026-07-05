import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@grocery/shared';
import { useAuthStore } from '../store/useAuthStore';
import { LoginScreen } from '../screens/LoginScreen';
import { MainTabsNavigator } from './MainTabsNavigator';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { ManageCategoriesScreen } from '../screens/ManageCategoriesScreen';
import { ProductFormScreen } from '../screens/ProductFormScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useTranslation();
  const { firebaseUser, initializing } = useAuthStore();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: COLORS.text, headerStyle: { backgroundColor: COLORS.surface } }}>
        {!firebaseUser ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t('orders.orderDetail') }} />
            <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} options={{ title: t('owner.manageCategories') }} />
            <Stack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={{ title: t('owner.addProduct') }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
