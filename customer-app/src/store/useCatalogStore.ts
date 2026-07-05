import { create } from 'zustand';
import type { Shop, Category, Product } from '@grocery/shared';

interface CatalogState {
  shop: Shop | null;
  categories: Category[];
  products: Product[];
  loading: boolean;
  setShop: (shop: Shop | null) => void;
  setCategories: (categories: Category[]) => void;
  setProducts: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  shop: null,
  categories: [],
  products: [],
  loading: true,
  setShop: (shop) => set({ shop }),
  setCategories: (categories) => set({ categories }),
  setProducts: (products) => set({ products }),
  setLoading: (loading) => set({ loading }),
}));
