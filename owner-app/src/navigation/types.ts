export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  OrderDetail: { orderId: string };
  ManageCategories: undefined;
  ProductForm: { productId?: string };
};

export type MainTabsParamList = {
  Dashboard: undefined;
  LiveOrders: undefined;
  Products: undefined;
  Settings: undefined;
};
