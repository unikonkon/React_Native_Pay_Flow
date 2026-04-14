import { create } from 'zustand';
import type { Wallet, WalletType } from '@/types';
import {
  getDb,
  getAllWallets,
  insertWallet,
  updateWallet as updateW,
  deleteWallet as deleteW,
} from '@/lib/stores/db';

interface WalletStore {
  wallets: Wallet[];
  isLoading: boolean;
  isInitialized: boolean;

  loadWallets: () => Promise<void>;
  getWalletById: (id: string) => Wallet | undefined;
  addWallet: (data: { name: string; type: WalletType; icon: string; color: string }) => Promise<void>;
  updateWallet: (id: string, updates: Partial<{ name: string; type: WalletType; icon: string; color: string }>) => Promise<void>;
  deleteWallet: (id: string) => Promise<boolean>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  isLoading: false,
  isInitialized: false,

  loadWallets: async () => {
    set({ isLoading: true });
    const db = getDb();
    const wallets = await getAllWallets(db);
    set({ wallets, isLoading: false, isInitialized: true });
  },

  getWalletById: (id) => {
    return get().wallets.find(w => w.id === id);
  },

  addWallet: async (data) => {
    const db = getDb();
    await insertWallet(db, data);
    await get().loadWallets();
  },

  updateWallet: async (id, updates) => {
    const db = getDb();
    await updateW(db, id, updates);
    await get().loadWallets();
  },

  deleteWallet: async (id) => {
    if (id === 'wallet-cash') return false;
    const db = getDb();
    await deleteW(db, id);
    await get().loadWallets();
    return true;
  },
}));
