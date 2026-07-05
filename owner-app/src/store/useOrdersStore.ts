import { create } from 'zustand';
import type { Order } from '@grocery/shared';

interface OrdersState {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
}));
