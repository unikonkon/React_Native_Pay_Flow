import { create } from 'zustand';
import type { AiHistory, AiPromptType } from '@/types';
import { getDb, getAllAiHistory, insertAiHistory, deleteAiHistory } from '@/lib/stores/db';

interface AiHistoryStore {
  histories: AiHistory[];
  isLoading: boolean;

  loadHistories: () => Promise<void>;
  addHistory: (data: {
    walletId: string | null;
    promptType: AiPromptType;
    year: number;
    responseType: 'structured' | 'full' | 'text';
    responseData: string;
  }) => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
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
}));
