import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  COLLECTIONS,
  DEFAULT_SHOP_ID,
  type Shop,
  type Category,
  type Product,
  type Order,
  type UserProfile,
} from '@grocery/shared';

export function subscribeToShop(onChange: (shop: Shop | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.shops, DEFAULT_SHOP_ID), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Shop) : null);
  });
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

// A single small store rarely has more than a couple hundred products, so
// one listener for the whole catalog (filtered/searched client-side) is
// simpler and cheaper on Firestore reads than a query per screen.
export function subscribeToAllProducts(onChange: (products: Product[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.products), where('shopId', '==', DEFAULT_SHOP_ID));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
  });
}

export function subscribeToUserOrders(
  userId: string,
  onChange: (orders: Order[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.orders),
    where('userId', '==', userId),
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

export async function placeOrder(order: Omit<Order, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.orders), order);
  return ref.id;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, userId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.users, profile.id), profile, { merge: true });
}
