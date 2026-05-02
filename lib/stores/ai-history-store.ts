import { create } from 'zustand';
import type { AiHistory, AiPromptType } from '@/types';
import { getDb, getAllAiHistory, insertAiHistory, deleteAiHistory, deleteAiHistoryByIds } from '@/lib/stores/db';

interface AiHistoryStore {
  histories: AiHistory[];
  isLoading: boolean;

  loadHistories: () => Promise<void>;
  addHistory: (data: {
    walletId: string | null;
    promptType: AiPromptType;
    year: number;
    month: number | null;
    responseType: 'structured' | 'full' | 'text' | 'savings_goal';
    responseData: string;
    targetAmount?: number | null;
    targetMonths?: number | null;
  }) => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
  deleteHistoriesBulk: (ids: string[]) => Promise<void>;
}

export const useAiHistoryStore = create<AiHistoryStore>((set, get) => ({
  histories: [],
  isLoading: false,

  loadHistories: async () => {
    set({ isLoading: true });
    const db = getDb();
    const histories = await getAllAiHistory(db);
    set({ histories, isLoading: false });
  },

  addHistory: async (data) => {
    const db = getDb();
    await insertAiHistory(db, data);
    await get().loadHistories();
  },

  deleteHistory: async (id) => {
    const db = getDb();
    await deleteAiHistory(db, id);
    await get().loadHistories();
  },

  deleteHistoriesBulk: async (ids) => {
    if (ids.length === 0) return;
    const db = getDb();
    await deleteAiHistoryByIds(db, ids);
    await get().loadHistories();
  },
}));
