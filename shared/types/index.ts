export type LanguageCode = 'en' | 'hi';

export type ProductUnit = 'kg' | 'litre' | 'pack' | 'piece' | 'dozen';

export type PaymentMode = 'COD' | 'UPI';

export type PaymentStatus = 'pending' | 'paid';

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'placed',
  'accepted',
  'packed',
  'out_for_delivery',
  'delivered',
];

export interface OpeningHours {
  open: string; // "09:00"
  close: string; // "21:00"
}

// A single doc for now (shops/main-shop), structured so a `shopId` can be
// added to categories/products/orders later to support multiple shops.
export interface Shop {
  id: string;
  shopName: string;
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  address: string;
  upiId: string;
  isOpen: boolean;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  openingHours: OpeningHours;
  ownerFcmToken?: string;
}

export interface Category {
  id: string;
  shopId: string;
  name_en: string;
  name_hi: string;
  icon: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId: string;
  name_en: string;
  name_hi: string;
  description_en: string;
  description_hi: string;
  price: number;
  unit: ProductUnit;
  imageUrl: string;
  isAvailable: boolean;
  stockQty?: number;
  isDailyItem: boolean;
  isFeatured: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Address {
  label: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  addresses: Address[];
  preferredLanguage: LanguageCode;
  fcmToken?: string;
}

export interface OrderItem {
  productId: string;
  name_en: string;
  name_hi: string;
  price: number;
  qty: number;
  unit: ProductUnit;
}

export interface Order {
  id: string;
  shopId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: Address;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  placedAt: number;
  statusUpdatedAt: number;
  customerNote?: string;
  cancelReason?: string;
}

export interface CartLine {
  product: Product;
  qty: number;
}
