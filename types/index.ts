export type TransactionType = 'income' | 'expense';

export type PeriodType =
  | 'week'
  | 'month'
  | '2months'
  | '3months'
  | '4months'
  | '6months'
  | 'year'
  | '2years'
  | 'all'
  | 'custom';
export interface Period {
  type: PeriodType;
  anchor: string; // YYYY-MM-DD — start of the unit
  endDate?: string; // YYYY-MM-DD — only used for 'custom' type
}

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
  walletId: string;
  category?: Category;
  wallet?: Wallet;
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
  defaultWalletId: string;
  categoryColumns: number;
  categoryRows: number;
  recCategoryColumns: number;
  recCategoryRows: number;
  recTxColumns: number;
  recTxRows: number;
  defaultCategoryTab: 'recommend' | 'select';
  showCommonCategories: boolean;
  showTopCategories: boolean;
  showFrequentPills: boolean;
  showHomeFrequentList: boolean; // Toggle the FrequentTransactions widget on the home screen
  homeFrequentRows: number;      // Number of rows for the home FrequentTransactions widget (1–4)
  commonCategoryLimit: number;
  topCategoryLimit: number;
  addTxSheetHeight: number; // Bottom sheet height (%) for add-transaction modal, range 50–95
}

// ===== Wallet Types =====

export type WalletType = 'cash' | 'bank' | 'credit_card' | 'e_wallet' | 'savings' | 'daily_expense';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  icon: string;
  color: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isAsset: boolean;
  createdAt: string;
}

export interface WalletBalance {
  income: number;
  expense: number;
  balance: number;
}

// ===== Transaction Extensions =====

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId?: string;
  date?: string;
  note?: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
  wallet?: Wallet;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
}

// ===== AI Analysis Types =====

export type AiPromptType = 'compact' | 'structured' | 'full' | 'savings_goal';

export interface AiHistory {
  id: string;
  walletId: string | null;
  promptType: AiPromptType;
  year: number;
  month: number | null; // 1-12, null = full year
  responseType: 'structured' | 'full' | 'text' | 'savings_goal';
  responseData: string;
  createdAt: string;
  /** Only set when promptType === 'savings_goal'. */
  targetAmount?: number | null;
  /** Only set when promptType === 'savings_goal'. */
  targetMonths?: number | null;
}

export interface StructuredResult {
  summary: {
    healthScore: string;
    totalIncome: number;
    totalExpense: number;
    savingRate: number;
    rule503020: {
      needs: number;
      wants: number;
      savings: number;
    };
  };
  recommendations: {
    monthlySaving: number;
    monthlyInvestment: number;
    emergencyFundTarget: number;
    investmentTypes: string[];
  };
  expensesToReduce: {
    category: string;
    amount: number;
    percent: number;
    targetReduction: number;
  }[];
  needExtraIncome: {
    required: boolean;
    suggestedAmount: number;
    reason: string;
  };
  actionPlan: string[];
  warnings: string[];
}

export interface SavingsGoalResult {
  goal: {
    targetAmount: number;
    targetMonths: number;
    monthlyRequired: number;
  };
  feasibility: {
    /** Current monthly net saving capacity (income − expense). */
    currentMonthlySaving: number;
    /** Positive = surplus per month, negative = shortfall. */
    monthlyGap: number;
    feasible: boolean;
    message: string;
  };
  expensesToCut: {
    category: string;
    currentAmount: number;
    suggestedReduction: number;
    /** Per-day equivalent of suggestedReduction. */
    dailyReduction: number;
    targetAmount: number;
    reason: string;
  }[];
  incomeOpportunities: {
    source: string;
    estimatedAmount: number;
    description: string;
  }[];
  actionPlan: string[];
  warnings: string[];
}

// ===== Alert Settings Types =====

export interface AlertSettings {
  monthlyExpenseTarget: number;
  isMonthlyTargetEnabled: boolean;
  dailyExpenseTarget: number;
  isDailyTargetEnabled: boolean;
  categoryLimits: CategoryLimit[];
  isCategoryLimitsEnabled: boolean;
}

export interface CategoryLimit {
  categoryId: string;
  limit: number;
}

// ===== Analysis (Duplicate Detection) Types =====

export type MatchType = 'basic' | 'full';

export interface Analysis {
  id: string;
  walletId: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  note?: string;
  matchType: MatchType;
  count: number;
  lastTransactionId: string;
  createdAt: string;
  updatedAt: string;
}

// ===== App Settings (Extended) =====

export interface AppSettings extends Settings {
  autoOpenTransaction: boolean;
  frequentOnHome: boolean;
  frequentOnHomeCount: number;
  frequentOnAddSheet: boolean;
}
