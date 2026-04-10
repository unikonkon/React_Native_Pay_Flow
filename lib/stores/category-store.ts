import { create } from 'zustand';
import type { Category, TransactionType } from '@/types';
import { getDb, getAllCategories, insertCategory, deleteCategory as deleteCat, updateCategory as updateCat } from '@/lib/stores/db';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;

  loadCategories: () => Promise<void>;
  getByType: (type: TransactionType) => Category[];
  addCategory: (data: { name: string; icon: string; color: string; type: TransactionType }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<{ name: string; icon: string; color: string }>) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,

  loadCategories: async () => {
    set({ isLoading: true });
    const db = getDb();
    const categories = await getAllCategories(db);
    set({ categories, isLoading: false });
  },

  getByType: (type) => {
    return get().categories.filter(c => c.type === type);
  },

  addCategory: async (data) => {
    const db = getDb();
    await insertCategory(db, data);
    await get().loadCategories();
  },

  deleteCategory: async (id) => {
    const db = getDb();
    await deleteCat(db, id);
    await get().loadCategories();
  },

  updateCategory: async (id, updates) => {
    const db = getDb();
    await updateCat(db, id, updates);
    await get().loadCategories();
  },
}));
