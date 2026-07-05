import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@grocery/shared';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { LanguageSelectScreen } from '../screens/auth/LanguageSelectScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { MainTabsNavigator } from './MainTabsNavigator';
import { CategoryProductsScreen } from '../screens/CategoryProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useTranslation();
  const { firebaseUser, profile, initializing } = useAuthStore();
  const hasChosenLanguage = useLanguageStore((s) => s.hasChosenLanguage);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isLoggedIn = !!firebaseUser && !!profile;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: COLORS.text, headerStyle: { backgroundColor: COLORS.surface } }}>
        {!hasChosenLanguage ? (
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ headerShown: false }} />
        ) : !isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} options={{ headerShown: false }} />
            <Stack.Screen
              name="CategoryProducts"
              component={CategoryProductsScreen}
              options={({ route }) => ({ title: route.params.categoryName })}
            />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: '' }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: t('cart.title') }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: t('checkout.title') }} />
            <Stack.Screen
              name="OrderConfirmation"
              component={OrderConfirmationScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t('orders.orderDetail') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
