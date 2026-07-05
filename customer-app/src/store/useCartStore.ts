import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartLine, Product } from '@grocery/shared';

interface CartState {
  lines: CartLine[];
  addItem: (product: Product) => void;
  incrementQty: (productId: string) => void;
  decrementQty: (productId: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  qtyOf: (productId: string) => number;
  subtotal: () => number;
  itemCount: () => number;
  setAllFromProducts: (items: { product: Product; qty: number }[]) => void;
  mergeItems: (items: { product: Product; qty: number }[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addItem: (product) =>
        set((state) => {
          const existing = state.lines.find((l) => l.product.id === product.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
              ),
            };
          }
          return { lines: [...state.lines, { product, qty: 1 }] };
        }),
      incrementQty: (productId) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.product.id === productId ? { ...l, qty: l.qty + 1 } : l
          ),
        })),
      decrementQty: (productId) =>
        set((state) => {
          const existing = state.lines.find((l) => l.product.id === productId);
          if (!existing) return state;
          if (existing.qty <= 1) {
            return { lines: state.lines.filter((l) => l.product.id !== productId) };
          }
          return {
            lines: state.lines.map((l) =>
              l.product.id === productId ? { ...l, qty: l.qty - 1 } : l
            ),
          };
        }),
      removeItem: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) })),
      clear: () => set({ lines: [] }),
      qtyOf: (productId) => get().lines.find((l) => l.product.id === productId)?.qty ?? 0,
      subtotal: () => get().lines.reduce((sum, l) => sum + l.product.price * l.qty, 0),
      itemCount: () => get().lines.reduce((sum, l) => sum + l.qty, 0),
      setAllFromProducts: (items) => set({ lines: items.map(({ product, qty }) => ({ product, qty })) }),
      // Adds qty on top of whatever is already in the cart for that product,
      // used by the daily-items "reorder usual list" quick action.
      mergeItems: (items) =>
        set((state) => {
          const lines = [...state.lines];
          for (const { product, qty } of items) {
            const idx = lines.findIndex((l) => l.product.id === product.id);
            if (idx >= 0) {
              lines[idx] = { ...lines[idx], qty: lines[idx].qty + qty };
            } else {
              lines.push({ product, qty });
            }
          }
          return { lines };
        }),
    }),
    {
      name: 'customer-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
