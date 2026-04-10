import { create } from 'zustand';
import type { Transaction, TransactionType } from '@/types';
import {
  getDb,
  getTransactionsByMonth,
  insertTransaction,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  upsertAnalysis,
} from '@/lib/stores/db';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  currentMonth: string;

  setCurrentMonth: (month: string) => void;
  loadTransactions: (month?: string) => Promise<void>;
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
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  currentMonth: getCurrentMonth(),

  setCurrentMonth: (month) => {
    set({ currentMonth: month });
  },

  loadTransactions: async (month) => {
    set({ isLoading: true });
    const m = month ?? get().currentMonth;
    const db = getDb();
    const transactions = await getTransactionsByMonth(db, m);
    set({ transactions, isLoading: false, currentMonth: m });
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
