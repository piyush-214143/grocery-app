import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import {
  COLLECTIONS,
  DEFAULT_SHOP_ID,
  type Shop,
  type Category,
  type Product,
  type Order,
  type OrderStatus,
} from '@grocery/shared';

export function subscribeToShop(onChange: (shop: Shop | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.shops, DEFAULT_SHOP_ID), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Shop) : null);
  });
}

export async function saveShop(shop: Omit<Shop, 'id'>): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.shops, DEFAULT_SHOP_ID), shop, { merge: true });
}

export function subscribeToCategories(onChange: (categories: Category[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.categories),
    where('shopId', '==', DEFAULT_SHOP_ID),
    orderBy('sortOrder', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
  });
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.categories), category);
  return ref.id;
}

export async function updateCategory(id: string, patch: Partial<Category>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.categories, id), patch);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.categories, id));
}

export function subscribeToAllProducts(onChange: (products: Product[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.products), where('shopId', '==', DEFAULT_SHOP_ID));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
  });
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.products), product);
  return ref.id;
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.products, id), patch);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.products, id));
}

// Not currently wired into the UI: Firebase Storage now requires the Blaze
// plan to provision a bucket (Feb 2026 policy change), so ProductFormScreen
// cycles picsum.photos placeholders instead of uploading real photos. Re-wire
// this in once the project is on Blaze -- pass an already-resized/compressed
// local URI (e.g. via expo-image-manipulator) to stay within Storage's free
// 5GB/1GB-per-day quota.
export async function uploadProductImage(localUri: string, productId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `products/${productId}.jpg`);
  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
}

export function subscribeToOrders(onChange: (orders: Order[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.orders),
    where('shopId', '==', DEFAULT_SHOP_ID),
    orderBy('placedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
  });
}

export function subscribeToOrder(orderId: string, onChange: (order: Order | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.orders, orderId), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
  });
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: OrderStatus,
  cancelReason?: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    orderStatus,
    statusUpdatedAt: Date.now(),
    ...(cancelReason ? { cancelReason } : {}),
  });
}

export async function markOrderPaid(orderId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), { paymentStatus: 'paid' });
}

export async function getUserFcmToken(userId: string): Promise<string | undefined> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, userId));
  return snap.exists() ? (snap.data().fcmToken as string | undefined) : undefined;
}
