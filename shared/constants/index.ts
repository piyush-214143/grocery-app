// Single-shop v1: every doc below lives under this fixed shop id so the
// schema can grow into `shops/{shopId}` without a data migration later.
export const DEFAULT_SHOP_ID = 'main-shop';

export const COLLECTIONS = {
  shops: 'shops',
  categories: 'categories',
  products: 'products',
  users: 'users',
  orders: 'orders',
} as const;

export const COLORS = {
  primary: '#2E7D32', // fresh green, grocery/produce feel
  primaryDark: '#1B5E20',
  accent: '#EF6C00', // warm orange for CTAs/badges
  background: '#F7FAF7',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#D32F2F',
  success: '#2E7D32',
  warning: '#F9A825',
} as const;

export const ORDER_STATUS_LABELS: Record<string, { en: string; hi: string }> = {
  placed: { en: 'Order Placed', hi: 'ऑर्डर दिया गया' },
  accepted: { en: 'Accepted', hi: 'स्वीकृत' },
  packed: { en: 'Packed', hi: 'पैक किया गया' },
  out_for_delivery: { en: 'Out for Delivery', hi: 'डिलीवरी के लिए निकला' },
  delivered: { en: 'Delivered', hi: 'डिलीवर हो गया' },
  cancelled: { en: 'Cancelled', hi: 'रद्द' },
};

export const UNIT_LABELS: Record<string, string> = {
  kg: 'kg',
  litre: 'L',
  pack: 'pack',
  piece: 'pc',
  dozen: 'dozen',
};

// Firestore Spark (free) plan daily quota, kept here as a reminder for
// anyone tuning listener/query frequency: 50K reads / 20K writes / 20K
// deletes per day, 1GiB stored. Ample for one small store.
export const FIRESTORE_FREE_TIER_NOTE =
  'Spark plan: 50K reads, 20K writes, 20K deletes/day, 1GiB storage.';
