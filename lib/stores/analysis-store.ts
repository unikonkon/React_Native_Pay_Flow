import { create } from 'zustand';
import type { Analysis } from '@/types';
import { getDb, getTopAnalyses } from '@/lib/stores/db';

interface AnalysisStore {
  analyses: Analysis[];
  isLoading: boolean;

  loadAnalysis: () => Promise<void>;
  getFrequentTransactions: (limit?: number) => Analysis[];
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analyses: [],
  isLoading: false,

  loadAnalysis: async () => {
    set({ isLoading: true });
    const db = getDb();
    const analyses = await getTopAnalyses(db);
    set({ analyses, isLoading: false });
  },

  getFrequentTransactions: (limit = 6) => {
    return get().analyses.slice(0, limit);
  },
}));
