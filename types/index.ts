export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isCustom: boolean;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  category?: Category;
  note?: string;
  date: string;
  createdAt: string;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategorySummary {
  categoryId: string;
  category?: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface Settings {
  currency: string;
  dateFormat: string;
  defaultTab: number;
  theme: 'light' | 'dark' | 'system';
}
