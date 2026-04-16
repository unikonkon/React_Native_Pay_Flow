import { create } from 'zustand';
import type { Analysis } from '@/types';
import { getDb, getTopAnalyses, getTopAnalysesByWallet } from '@/lib/stores/db';

interface AnalysisStore {
  analyses: Analysis[];
  isLoading: boolean;

  loadAnalysis: (walletId?: string | null) => Promise<void>;
  getFrequentTransactions: (limit?: number) => Analysis[];
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analyses: [],
  isLoading: false,

  loadAnalysis: async (walletId) => {
    set({ isLoading: true });
    const db = getDb();
    const analyses = walletId
      ? await getTopAnalysesByWallet(db, walletId, 'expense', 10)
      : await getTopAnalyses(db, 10);
    set({ analyses, isLoading: false });
  },

  getFrequentTransactions: (limit = 10) => {
    return get().analyses.slice(0, limit);
  },
}));
