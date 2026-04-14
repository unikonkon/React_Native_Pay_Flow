import { create } from 'zustand';
import type { Period, Transaction, TransactionType } from '@/types';
import {
  getDb,
  getTransactionsByRange,
  insertTransaction,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  upsertAnalysis,
} from '@/lib/stores/db';
import { getCurrentPeriod, getPeriodRange } from '@/lib/utils/period';
import { sendBudgetAlert } from '@/lib/utils/notifications';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  currentPeriod: Period;
  selectedWalletId: string | null;
  editingTransaction: Transaction | null;

  setCurrentPeriod: (period: Period) => void;
  setSelectedWalletId: (id: string | null) => void;
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
  setEditingTransaction: (tx: Transaction | null) => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  currentPeriod: getCurrentPeriod('month'),
  selectedWalletId: null,
  editingTransaction: null,

  setCurrentPeriod: (period) => set({ currentPeriod: period }),
  setSelectedWalletId: (id) => set({ selectedWalletId: id }),
  setEditingTransaction: (tx) => set({ editingTransaction: tx }),

  loadTransactions: async (period) => {
    set({ isLoading: true });
    const p = period ?? get().currentPeriod;
    const { start, end } = getPeriodRange(p);
    const db = getDb();
    const transactions = await getTransactionsByRange(db, start, end);
    set({ transactions, isLoading: false, currentPeriod: p });
  },

  addTransaction: async (data) => {
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
    if (alertSettings.isMonthlyTargetEnabled && data.type === 'expense') {
      const monthlyExpense = get().transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      await sendBudgetAlert(monthlyExpense, alertSettings.monthlyExpenseTarget);
    }
  },

  updateTransaction: async (id, data) => {
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
  },

  deleteTransaction: async (id) => {
    const db = getDb();
    await deleteTx(db, id);
    await get().loadTransactions();
  },
}));
