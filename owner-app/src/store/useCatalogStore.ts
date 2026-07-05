import { create } from 'zustand';
import type { Shop, Category, Product } from '@grocery/shared';

interface CatalogState {
  shop: Shop | null;
  categories: Category[];
  products: Product[];
  setShop: (shop: Shop | null) => void;
  setCategories: (categories: Category[]) => void;
  setProducts: (products: Product[]) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  shop: null,
  categories: [],
  products: [],
  setShop: (shop) => set({ shop }),
  setCategories: (categories) => set({ categories }),
  setProducts: (products) => set({ products }),
}));
