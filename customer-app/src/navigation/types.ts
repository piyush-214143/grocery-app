export type RootStackParamList = {
  LanguageSelect: undefined;
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  ProductDetail: { productId: string };
  Search: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  OrderDetail: { orderId: string };
};

export type MainTabsParamList = {
  Home: undefined;
  DailyItems: undefined;
  Orders: undefined;
  Profile: undefined;
};
