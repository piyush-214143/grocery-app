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
  type DocumentReference,
  type Query,
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

// Right after first-time-setup signup, LoginScreen creates auth user then
// writes /admins/{uid} as two separate awaited calls -- but Firebase fires
// onAuthStateChanged (which is what triggers these subscriptions in App.tsx)
// as soon as the user is created, which can race ahead of the admins/{uid}
// write finishing. A `permission-denied` at that moment is transient: retry
// a few times with backoff instead of leaving the listener dead forever.
function subscribeWithRetry(
  target: DocumentReference | Query,
  onNext: (snap: any) => void,
  retriesLeft = 4
): Unsubscribe {
  let unsub: Unsubscribe = () => {};
  let cancelled = false;

  unsub = onSnapshot(target as any, onNext, (error: any) => {
    if (cancelled) return;
    if (error?.code === 'permission-denied' && retriesLeft > 0) {
      setTimeout(() => {
        if (!cancelled) unsub = subscribeWithRetry(target, onNext, retriesLeft - 1);
      }, 700);
    } else {
      console.warn('Firestore subscription failed', error);
    }
  });

  return () => {
    cancelled = true;
    unsub();
  };
}

export function subscribeToShop(onChange: (shop: Shop | null) => void): Unsubscribe {
  return subscribeWithRetry(doc(db, COLLECTIONS.shops, DEFAULT_SHOP_ID), (snap) => {
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
  return subscribeWithRetry(q, (snap) => {
    onChange(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Category)));
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
  return subscribeWithRetry(q, (snap) => {
    onChange(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Product)));
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
  return subscribeWithRetry(q, (snap) => {
    onChange(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Order)));
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
