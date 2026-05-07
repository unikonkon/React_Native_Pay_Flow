import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Period, Transaction, TransactionType } from '@/types';
import {
  getDb,
  getTransactionsByRange,
  getSummaryByRange,
  insertTransaction,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  deleteTransactionsBatch,
  upsertAnalysis,
} from '@/lib/stores/db';
import { getCurrentPeriod, getPeriodRange } from '@/lib/utils/period';
import { sendBudgetAlert, sendDailyBudgetAlert } from '@/lib/utils/notifications';
import { getToday } from '@/lib/utils/format';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';

const SELECTED_WALLET_KEY = 'selected_wallet_id';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  currentPeriod: Period;
  selectedWalletId: string | null;
  editingTransaction: Transaction | null;
  totalIncome: number;
  totalExpense: number;

  setCurrentPeriod: (period: Period) => void;
  setSelectedWalletId: (id: string | null) => void;
  loadSelectedWalletId: () => Promise<void>;
  loadTransactions: (period?: Period) => Promise<void>;
  addTransaction: (data: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    walletId?: string;
    note?: string;
    date: string;
  }) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  setEditingTransaction: (tx: Transaction | null) => void;
}

let _loadId = 0;

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  currentPeriod: getCurrentPeriod('month'),
  selectedWalletId: null,
  editingTransaction: null,
  totalIncome: 0,
  totalExpense: 0,

  setCurrentPeriod: (period) => {
    set({ currentPeriod: period });
    get().loadTransactions(period);
  },
  setSelectedWalletId: (id) => {
    set({ selectedWalletId: id });
    AsyncStorage.setItem(SELECTED_WALLET_KEY, id ?? '').catch(() => {});
    get().loadTransactions();
  },
  loadSelectedWalletId: async () => {
    try {
      const saved = await AsyncStorage.getItem(SELECTED_WALLET_KEY);
      const id = saved ? saved : null;
      if (id !== get().selectedWalletId) {
        set({ selectedWalletId: id });
        get().loadTransactions();
      }
    } catch {}
  },
  setEditingTransaction: (tx) => set({ editingTransaction: tx }),

  loadTransactions: async (period) => {
    const id = ++_loadId;
    set({ isLoading: true });
    try {
      const p = period ?? get().currentPeriod;
      const walletId = get().selectedWalletId;
      const { start, end } = getPeriodRange(p);
      const db = getDb();
      const [transactions, summary] = await Promise.all([
        getTransactionsByRange(db, start, end, walletId),
        getSummaryByRange(db, start, end, walletId),
      ]);
      // Stale guard: discard result if a newer load was started
      if (id !== _loadId) return;
      set({
        transactions,
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
      });
    } catch (err) {
      console.error('[loadTransactions]', err);
    } finally {
      if (id === _loadId) {
        set({ isLoading: false });
      }
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true });
    try {
      const db = getDb();
      const walletId = data.walletId ?? 'wallet-cash';
      const txId = await insertTransaction(db, { ...data, walletId });

      const matchType = data.note ? 'full' : 'basic';
      await upsertAnalysis(db, {
        walletId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        note: data.note,
        transactionId: txId,
      }, matchType);

      await get().loadTransactions();

      const alertSettings = useAlertSettingsStore.getState();
      if (data.type === 'expense') {
        if (alertSettings.isMonthlyTargetEnabled && alertSettings.monthlyExpenseTarget > 0) {
          const p = get().currentPeriod;
          const { start, end } = getPeriodRange(p);
          const summary = await getSummaryByRange(db, start, end, get().selectedWalletId);
          await sendBudgetAlert(summary.totalExpense, alertSettings.monthlyExpenseTarget);
        }
        if (alertSettings.isDailyTargetEnabled && alertSettings.dailyExpenseTarget > 0) {
          const today = getToday();
          const dailySummary = await getSummaryByRange(db, today, today, get().selectedWalletId);
          await sendDailyBudgetAlert(dailySummary.totalExpense, alertSettings.dailyExpenseTarget);
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateTransaction: async (id, data) => {
    set({ isLoading: true });
    try {
      const db = getDb();
      await updateTx(db, id, {
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        walletId: data.walletId,
        note: data.note,
        date: data.date,
      });
      await get().loadTransactions();
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true });
    try {
      const db = getDb();
      await deleteTx(db, id);
      await get().loadTransactions();
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTransactions: async (ids) => {
    set({ isLoading: true });
    try {
      const db = getDb();
      await deleteTransactionsBatch(db, ids);
      await get().loadTransactions();
    } finally {
      set({ isLoading: false });
    }
  },
}));
