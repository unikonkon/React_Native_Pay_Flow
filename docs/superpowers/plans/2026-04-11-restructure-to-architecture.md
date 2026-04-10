# CeasFlow Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure CeasFlow project directories and files to match MOBILE-APP-ARCHITECTURE.md, add new type definitions, expand to 4 tabs, and prepare placeholder screens for future phases.

**Architecture:** Move all source files into a `lib/` directory structure (stores, utils, constants, api). Merge 5 database files into a single `lib/stores/db.ts`. Merge currency+date utils into `lib/utils/format.ts`. Rename tabs and add AI Analysis tab. Add new TypeScript interfaces for wallets, AI, alerts, and analysis.

**Tech Stack:** React Native + Expo, TypeScript, Zustand, expo-sqlite, NativeWind

---

### Task 1: Create new directory structure

**Files:**
- Create: `lib/stores/` (directory)
- Create: `lib/utils/` (directory)
- Create: `lib/constants/` (directory)
- Create: `lib/api/` (directory)
- Create: `components/common/` (directory)
- Create: `components/analytics/` (directory)
- Create: `components/ai/` (directory)
- Create: `components/settings/` (directory)
- Create: `components/layout/` (directory)
- Create: `app/settings/` (directory)

- [ ] **Step 1: Create all directories**

```bash
mkdir -p lib/stores lib/utils lib/constants lib/api
mkdir -p components/common components/analytics components/ai components/settings components/layout
mkdir -p app/settings
```

- [ ] **Step 2: Verify directories exist**

```bash
ls -d lib/stores lib/utils lib/constants lib/api components/common components/analytics components/ai components/settings components/layout app/settings
```

Expected: All 10 directories listed without error.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: create new directory structure for architecture migration"
```

---

### Task 2: Create `lib/utils/id.ts` (move)

**Files:**
- Create: `lib/utils/id.ts`
- Delete: `utils/id.ts`

- [ ] **Step 1: Create `lib/utils/id.ts`**

```typescript
export function generateId(): string {
  const hex = '0123456789abcdef';
  const s = (n: number) => {
    let str = '';
    for (let i = 0; i < n; i++) str += hex[Math.floor(Math.random() * 16)];
    return str;
  };
  return `${s(8)}-${s(4)}-4${s(3)}-${hex[8 + Math.floor(Math.random() * 4)]}${s(3)}-${s(12)}`;
}
```

- [ ] **Step 2: Delete old file**

```bash
rm utils/id.ts
```

- [ ] **Step 3: Commit**

```bash
git add lib/utils/id.ts
git add utils/id.ts
git commit -m "refactor: move id utility to lib/utils/id.ts"
```

---

### Task 3: Create `lib/utils/format.ts` (merge currency + date)

**Files:**
- Create: `lib/utils/format.ts`
- Delete: `utils/currency.ts`
- Delete: `utils/date.ts`

- [ ] **Step 1: Create `lib/utils/format.ts`**

```typescript
// ===== Currency Formatting =====

export function formatCurrency(amount: number, currency = 'THB'): string {
  const symbol = currency === 'THB' ? '฿' : currency;
  return `${symbol}${amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function parseCurrencyInput(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('th-TH');
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ===== Thai Month/Day Names =====

export const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const THAI_DAYS = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์',
];

// ===== Date Formatting =====

export function formatDateThai(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  return `${day} ${month}`;
}

export function formatMonthYearThai(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const monthName = THAI_MONTHS_FULL[parseInt(month, 10) - 1];
  const buddhistYear = parseInt(year, 10) + 543;
  return `${monthName} ${buddhistYear}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function shiftMonth(month: string, offset: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(d, today)) return 'วันนี้';
  if (isSameDay(d, yesterday)) return 'เมื่อวาน';
  return formatDateThai(dateStr);
}

export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function getDayOfWeek(date: Date): string {
  return THAI_DAYS[date.getDay()];
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
```

- [ ] **Step 2: Delete old files**

```bash
rm utils/currency.ts utils/date.ts
```

- [ ] **Step 3: Commit**

```bash
git add lib/utils/format.ts
git add utils/currency.ts utils/date.ts
git commit -m "refactor: merge currency and date utils into lib/utils/format.ts"
```

---

### Task 4: Move `lib/utils/export.ts`

**Files:**
- Create: `lib/utils/export.ts`
- Delete: `utils/export.ts`

- [ ] **Step 1: Create `lib/utils/export.ts`**

Copy the content from `utils/export.ts` but update the import path:

```typescript
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system/next';
import type { Transaction } from '@/types';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportToCSV(transactions: Transaction[]) {
  const BOM = '\uFEFF';
  const header = 'วันที่,ประเภท,หมวดหมู่,จำนวนเงิน,หมายเหตุ';
  const rows = transactions.map(t =>
    [
      t.date,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      escapeCSV(t.category?.name ?? ''),
      t.amount.toString(),
      escapeCSV(t.note || ''),
    ].join(',')
  );

  const csv = BOM + [header, ...rows].join('\n');
  const filePath = `${Paths.document}/expense_${Date.now()}.csv`;
  const file = new File(filePath);
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}
```

- [ ] **Step 2: Delete old file and the now-empty `utils/` directory**

```bash
rm utils/export.ts
rmdir utils
```

- [ ] **Step 3: Commit**

```bash
git add lib/utils/export.ts
git add utils/
git commit -m "refactor: move export utility to lib/utils/export.ts"
```

---

### Task 5: Move `lib/constants/categories.ts`

**Files:**
- Create: `lib/constants/categories.ts`
- Delete: `constants/categories.ts`
- Delete: `constants/theme.ts`
- Delete: `constants/` (directory)

- [ ] **Step 1: Create `lib/constants/categories.ts`**

```typescript
import type { Category } from '@/types';

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'isCustom'>[] = [
  { id: 'exp-food', name: 'อาหาร-เครื่องดื่ม', icon: 'fast-food', color: '#FF6B6B', type: 'expense', sortOrder: 0 },
  { id: 'exp-transport', name: 'เดินทาง', icon: 'car', color: '#4ECDC4', type: 'expense', sortOrder: 1 },
  { id: 'exp-housing', name: 'ที่พัก', icon: 'home', color: '#45B7D1', type: 'expense', sortOrder: 2 },
  { id: 'exp-health', name: 'สุขภาพ', icon: 'medkit', color: '#96CEB4', type: 'expense', sortOrder: 3 },
  { id: 'exp-entertainment', name: 'บันเทิง', icon: 'game-controller', color: '#FFEAA7', type: 'expense', sortOrder: 4 },
  { id: 'exp-clothing', name: 'เสื้อผ้า', icon: 'shirt', color: '#DDA0DD', type: 'expense', sortOrder: 5 },
  { id: 'exp-education', name: 'การศึกษา', icon: 'book', color: '#98D8C8', type: 'expense', sortOrder: 6 },
  { id: 'exp-other', name: 'อื่น ๆ', icon: 'build', color: '#B0B0B0', type: 'expense', sortOrder: 7 },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'isCustom'>[] = [
  { id: 'inc-salary', name: 'เงินเดือน', icon: 'briefcase', color: '#2ECC71', type: 'income', sortOrder: 0 },
  { id: 'inc-extra', name: 'รายได้พิเศษ', icon: 'cash', color: '#27AE60', type: 'income', sortOrder: 1 },
  { id: 'inc-gift', name: 'รับของขวัญ', icon: 'gift', color: '#F39C12', type: 'income', sortOrder: 2 },
  { id: 'inc-invest', name: 'ลงทุน', icon: 'trending-up', color: '#16A085', type: 'income', sortOrder: 3 },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
```

- [ ] **Step 2: Delete old files and directory**

```bash
rm constants/categories.ts constants/theme.ts
rmdir constants
```

- [ ] **Step 3: Commit**

```bash
git add lib/constants/categories.ts
git add constants/
git commit -m "refactor: move categories to lib/constants/, remove unused theme.ts"
```

---

### Task 6: Create `lib/stores/db.ts` (merge 5 files)

**Files:**
- Create: `lib/stores/db.ts`
- Delete: `db/schema.ts`
- Delete: `db/migrations.ts`
- Delete: `db/queries/transactions.ts`
- Delete: `db/queries/categories.ts`
- Delete: `hooks/useDatabase.ts`

- [ ] **Step 1: Create `lib/stores/db.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Category, Transaction, TransactionType } from '@/types';
import { generateId } from '@/lib/utils/id';
import { ALL_DEFAULT_CATEGORIES } from '@/lib/constants/categories';

// ===== Database Singleton =====

let dbInstance: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
}

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);

  const initDB = useCallback(async () => {
    if (dbInstance) {
      setIsReady(true);
      return;
    }

    const db = await openDatabaseAsync('ceasflow.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await migrateDatabase(db);
    dbInstance = db;
    setIsReady(true);
  }, []);

  useEffect(() => {
    initDB();
  }, [initDB]);

  return { isReady, db: dbInstance };
}

// ===== Schema =====

const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    icon       TEXT NOT NULL,
    color      TEXT NOT NULL,
    type       TEXT NOT NULL CHECK(type IN ('income','expense')),
    is_custom  INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );
`;

const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    amount      REAL NOT NULL,
    category_id TEXT NOT NULL,
    note        TEXT,
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`;

const CREATE_WALLETS_TABLE = `
  CREATE TABLE IF NOT EXISTS wallets (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK(type IN ('cash','bank','credit_card','e_wallet','savings','daily_expense')),
    icon            TEXT NOT NULL,
    color           TEXT NOT NULL,
    currency        TEXT DEFAULT 'THB',
    initial_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    is_asset        INTEGER DEFAULT 1,
    created_at      TEXT NOT NULL
  );
`;

const CREATE_AI_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS ai_history (
    id            TEXT PRIMARY KEY,
    wallet_id     TEXT,
    prompt_type   TEXT NOT NULL,
    year          INTEGER NOT NULL,
    response_type TEXT NOT NULL,
    response_data TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );
`;

const CREATE_ANALYSIS_TABLE = `
  CREATE TABLE IF NOT EXISTS analysis (
    id                  TEXT PRIMARY KEY,
    wallet_id           TEXT NOT NULL,
    type                TEXT NOT NULL,
    category_id         TEXT NOT NULL,
    amount              REAL NOT NULL,
    note                TEXT,
    match_type          TEXT NOT NULL CHECK(match_type IN ('basic', 'full')),
    count               INTEGER DEFAULT 1,
    last_transaction_id TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
  );
`;

const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);',
  'CREATE INDEX IF NOT EXISTS idx_wallets_type ON wallets(type);',
];

// ===== Migrations =====

async function migrateDatabase(db: SQLiteDatabase) {
  const catInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(categories)");
  const txInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(transactions)");

  if (catInfo.length > 0 && !catInfo.some(c => c.name === 'is_custom')) {
    await db.execAsync('DROP TABLE IF EXISTS categories');
  }
  if (txInfo.length > 0 && txInfo.some(c => c.name === 'book_id')) {
    await db.execAsync('DROP TABLE IF EXISTS transactions');
  }

  await db.execAsync(CREATE_CATEGORIES_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);
  await db.execAsync(CREATE_WALLETS_TABLE);
  await db.execAsync(CREATE_AI_HISTORY_TABLE);
  await db.execAsync(CREATE_ANALYSIS_TABLE);

  for (const sql of CREATE_INDEXES) {
    await db.execAsync(sql);
  }

  await seedDefaultCategories(db);
}

async function seedDefaultCategories(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE is_custom = 0'
  );

  if (existing && existing.count > 0) return;

  for (const cat of ALL_DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, icon, color, type, is_custom, sort_order)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.sortOrder]
    );
  }
}

// ===== Transaction Queries =====

export async function getTransactionsByMonth(db: SQLiteDatabase, month: string): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; note: string | null;
    date: string; created_at: string;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
    cat_is_custom: number; cat_sort_order: number;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
            c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE strftime('%Y-%m', t.date) = ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [month]
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: r.created_at,
    category: {
      id: r.category_id,
      name: r.cat_name,
      icon: r.cat_icon,
      color: r.cat_color,
      type: r.cat_type as TransactionType,
      isCustom: r.cat_is_custom === 1,
      sortOrder: r.cat_sort_order,
    },
  }));
}

export async function getAllTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; note: string | null;
    date: string; created_at: string;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color, c.type as cat_type
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC, t.created_at DESC`
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: r.created_at,
    category: {
      id: r.category_id,
      name: r.cat_name,
      icon: r.cat_icon,
      color: r.cat_color,
      type: r.cat_type as TransactionType,
      isCustom: false,
      sortOrder: 0,
    },
  }));
}

export async function insertTransaction(
  db: SQLiteDatabase,
  data: { type: TransactionType; amount: number; categoryId: string; note?: string; date: string }
) {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.type, data.amount, data.categoryId, data.note ?? null, data.date, createdAt]
  );

  return id;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  data: Partial<{ type: TransactionType; amount: number; categoryId: string; note: string; date: string }>
) {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.amount !== undefined) { sets.push('amount = ?'); values.push(data.amount); }
  if (data.categoryId !== undefined) { sets.push('category_id = ?'); values.push(data.categoryId); }
  if (data.note !== undefined) { sets.push('note = ?'); values.push(data.note); }
  if (data.date !== undefined) { sets.push('date = ?'); values.push(data.date); }

  if (sets.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteTransaction(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

// ===== Category Queries =====

export async function getAllCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: string; name: string; icon: string; color: string;
    type: string; is_custom: number; sort_order: number;
  }>('SELECT * FROM categories ORDER BY type, sort_order');

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as TransactionType,
    isCustom: r.is_custom === 1,
    sortOrder: r.sort_order,
  }));
}

export async function getCategoriesByType(db: SQLiteDatabase, type: TransactionType): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: string; name: string; icon: string; color: string;
    type: string; is_custom: number; sort_order: number;
  }>('SELECT * FROM categories WHERE type = ? ORDER BY sort_order', [type]);

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as TransactionType,
    isCustom: r.is_custom === 1,
    sortOrder: r.sort_order,
  }));
}

export async function insertCategory(
  db: SQLiteDatabase,
  data: { name: string; icon: string; color: string; type: TransactionType }
) {
  const id = generateId();
  const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM categories WHERE type = ?',
    [data.type]
  );

  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [id, data.name, data.icon, data.color, data.type, (maxOrder?.max_order ?? -1) + 1]
  );

  return id;
}

export async function deleteCategory(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM categories WHERE id = ? AND is_custom = 1', [id]);
}

// ===== Wallet Queries (stubs - implement in Phase 2) =====

export async function getAllWallets(db: SQLiteDatabase) {
  return db.getAllAsync('SELECT * FROM wallets ORDER BY created_at');
}

export async function insertWallet(
  db: SQLiteDatabase,
  _data: { name: string; type: string; icon: string; color: string }
) {
  // Stub - implement in Phase 2
  void db;
}

// ===== AI History Queries (stubs - implement in Phase 3) =====

export async function getAiHistory(db: SQLiteDatabase) {
  return db.getAllAsync('SELECT * FROM ai_history ORDER BY created_at DESC');
}

// ===== Analysis Queries (stubs - implement in Phase 2) =====

export async function getAnalysis(db: SQLiteDatabase) {
  return db.getAllAsync('SELECT * FROM analysis ORDER BY count DESC');
}
```

- [ ] **Step 2: Delete old files and directories**

```bash
rm db/schema.ts db/migrations.ts db/queries/transactions.ts db/queries/categories.ts
rmdir db/queries
rmdir db
rm hooks/useDatabase.ts
```

- [ ] **Step 3: Commit**

```bash
git add lib/stores/db.ts
git add db/ hooks/useDatabase.ts
git commit -m "refactor: merge db/, hooks/useDatabase into lib/stores/db.ts"
```

---

### Task 7: Move Zustand stores to `lib/stores/` (kebab-case)

**Files:**
- Create: `lib/stores/transaction-store.ts`
- Create: `lib/stores/category-store.ts`
- Create: `lib/stores/settings-store.ts`
- Delete: `stores/transactionStore.ts`
- Delete: `stores/categoryStore.ts`
- Delete: `stores/settingsStore.ts`

- [ ] **Step 1: Create `lib/stores/transaction-store.ts`**

```typescript
import { create } from 'zustand';
import type { Transaction, TransactionType } from '@/types';
import {
  getDb,
  getTransactionsByMonth,
  insertTransaction,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
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
    await insertTransaction(db, data);
    await get().loadTransactions();
  },

  updateTransaction: async (id, data) => {
    const db = getDb();
    await updateTx(db, id, {
      type: data.type,
      amount: data.amount,
      categoryId: data.categoryId,
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
```

- [ ] **Step 2: Create `lib/stores/category-store.ts`**

```typescript
import { create } from 'zustand';
import type { Category, TransactionType } from '@/types';
import {
  getDb,
  getAllCategories,
  insertCategory,
  deleteCategory as deleteCat,
} from '@/lib/stores/db';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;

  loadCategories: () => Promise<void>;
  getByType: (type: TransactionType) => Category[];
  addCategory: (data: { name: string; icon: string; color: string; type: TransactionType }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,

  loadCategories: async () => {
    set({ isLoading: true });
    const db = getDb();
    const categories = await getAllCategories(db);
    set({ categories, isLoading: false });
  },

  getByType: (type) => {
    return get().categories.filter(c => c.type === type);
  },

  addCategory: async (data) => {
    const db = getDb();
    await insertCategory(db, data);
    await get().loadCategories();
  },

  deleteCategory: async (id) => {
    const db = getDb();
    await deleteCat(db, id);
    await get().loadCategories();
  },
}));
```

- [ ] **Step 3: Create `lib/stores/settings-store.ts`**

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings } from '@/types';

const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: Settings = {
  currency: 'THB',
  dateFormat: 'DD/MM/YYYY',
  defaultTab: 0,
  theme: 'system',
};

interface SettingsStore extends Settings {
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (json) {
      const saved = JSON.parse(json) as Partial<Settings>;
      set({ ...DEFAULT_SETTINGS, ...saved, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },

  updateSettings: async (partial) => {
    const current: Settings = {
      currency: get().currency,
      dateFormat: get().dateFormat,
      defaultTab: get().defaultTab,
      theme: get().theme,
    };
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    set(updated);
  },
}));
```

- [ ] **Step 4: Delete old store files and directory**

```bash
rm stores/transactionStore.ts stores/categoryStore.ts stores/settingsStore.ts
rmdir stores
```

- [ ] **Step 5: Commit**

```bash
git add lib/stores/transaction-store.ts lib/stores/category-store.ts lib/stores/settings-store.ts
git add stores/
git commit -m "refactor: move Zustand stores to lib/stores/ with kebab-case naming"
```

---

### Task 8: Move components (analytics, layout) and clean up empty folders

**Files:**
- Create: `components/analytics/BalanceCard.tsx`
- Create: `components/analytics/BarChartView.tsx`
- Create: `components/analytics/PieChartView.tsx`
- Create: `components/layout/HapticTab.tsx`
- Delete: `components/summary/` (entire folder)
- Delete: `components/haptic-tab.tsx`
- Delete: `components/transactions/` (empty)
- Delete: `components/wallets/` (empty)

- [ ] **Step 1: Move summary components to analytics (update imports)**

Create `components/analytics/BalanceCard.tsx`:

```typescript
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function BalanceCard({ totalIncome, totalExpense, balance }: BalanceCardProps) {
  return (
    <View className="bg-card rounded-2xl p-5 mx-4 mb-4 border border-border">
      <Text className="text-muted-foreground text-sm mb-1">คงเหลือ</Text>
      <Text className={`text-3xl font-bold mb-4 ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
        {formatCurrency(Math.abs(balance))}
      </Text>

      <View className="flex-row justify-between">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-income/20 items-center justify-center mr-2">
            <Ionicons name="arrow-up" size={16} color="#22C55E" />
          </View>
          <View>
            <Text className="text-muted-foreground text-xs">รายรับ</Text>
            <Text className="text-income font-bold">{formatCurrency(totalIncome)}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-expense/20 items-center justify-center mr-2">
            <Ionicons name="arrow-down" size={16} color="#EF4444" />
          </View>
          <View>
            <Text className="text-muted-foreground text-xs">รายจ่าย</Text>
            <Text className="text-expense font-bold">{formatCurrency(totalExpense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
```

Create `components/analytics/BarChartView.tsx`:

```typescript
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface BarChartViewProps {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
}

const screenWidth = Dimensions.get('window').width;

export function BarChartView({ labels, incomeData, expenseData }: BarChartViewProps) {
  if (labels.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-muted-foreground">ไม่มีข้อมูล</Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-foreground font-bold text-base px-4 mb-2">รายรับ-รายจ่ายรายเดือน</Text>

      <View className="flex-row justify-center gap-4 mb-2 px-4">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-income mr-1" />
          <Text className="text-muted-foreground text-xs">รายรับ</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-expense mr-1" />
          <Text className="text-muted-foreground text-xs">รายจ่าย</Text>
        </View>
      </View>

      <BarChart
        data={{
          labels,
          datasets: [
            { data: expenseData.length > 0 ? expenseData : [0] },
          ],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel="฿"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
          barPercentage: 0.6,
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#f0f0f0',
          },
        }}
        style={{ borderRadius: 12, marginHorizontal: 16 }}
      />
    </View>
  );
}
```

Create `components/analytics/PieChartView.tsx`:

```typescript
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import type { CategorySummary } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface PieChartViewProps {
  data: CategorySummary[];
  title: string;
}

const screenWidth = Dimensions.get('window').width;

export function PieChartView({ data, title }: PieChartViewProps) {
  if (data.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-muted-foreground">ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const chartData = data.slice(0, 6).map((item) => ({
    name: item.category?.name ?? 'อื่น ๆ',
    amount: item.total,
    color: item.category?.color ?? '#999',
    legendFontColor: '#666',
    legendFontSize: 12,
  }));

  return (
    <View className="mb-4">
      <Text className="text-foreground font-bold text-base px-4 mb-2">{title}</Text>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
      />

      <View className="px-4 mt-2">
        {data.slice(0, 5).map((item) => (
          <View key={item.categoryId} className="flex-row items-center py-2">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: item.category?.color ?? '#999' }}
            >
              <Ionicons
                name={(item.category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                size={16}
                color="white"
              />
            </View>
            <Text className="flex-1 text-foreground">{item.category?.name ?? 'อื่น ๆ'}</Text>
            <Text className="text-foreground font-semibold mr-2">{formatCurrency(item.total)}</Text>
            <Text className="text-muted-foreground text-sm w-12 text-right">
              {item.percentage.toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Move haptic-tab to layout**

Create `components/layout/HapticTab.tsx`:

```typescript
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
```

- [ ] **Step 3: Delete old files and empty folders**

```bash
rm components/summary/BalanceCard.tsx components/summary/BarChartView.tsx components/summary/PieChartView.tsx
rmdir components/summary
rm components/haptic-tab.tsx
rmdir components/transactions components/wallets
```

- [ ] **Step 4: Commit**

```bash
git add components/analytics/ components/layout/HapticTab.tsx
git add components/summary/ components/haptic-tab.tsx components/transactions components/wallets
git commit -m "refactor: rename summary->analytics, move haptic-tab to layout/, remove empty dirs"
```

---

### Task 9: Update `types/index.ts` with new interfaces

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add new types to `types/index.ts`**

Append the following after the existing `Settings` interface (keep all existing types unchanged):

```typescript
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

export type AiPromptType = 'compact' | 'structured' | 'full';

export interface AiHistory {
  id: string;
  walletId: string | null;
  promptType: AiPromptType;
  year: number;
  responseType: 'structured' | 'full' | 'text';
  responseData: string;
  createdAt: string;
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

// ===== Alert Settings Types =====

export interface AlertSettings {
  monthlyExpenseTarget: number;
  isMonthlyTargetEnabled: boolean;
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
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add Wallet, AI, Alert, Analysis type definitions"
```

---

### Task 10: Update `hooks/useSummary.ts` imports

**Files:**
- Modify: `hooks/useSummary.ts`

- [ ] **Step 1: Update useSummary.ts**

The file imports from `@/types` only — no changes needed since `types/index.ts` path is unchanged.

Verify:

```bash
grep -n "from '@/" hooks/useSummary.ts
```

Expected: Only `import ... from '@/types'` — no old paths to update.

- [ ] **Step 2: Delete unused color scheme hooks**

```bash
rm hooks/use-color-scheme.ts hooks/use-color-scheme.web.ts
```

These are not imported anywhere (components use `useColorScheme` from `react-native` directly).

- [ ] **Step 3: Commit**

```bash
git add hooks/
git commit -m "chore: remove unused color scheme hooks"
```

---

### Task 11: Update `components/transaction/*` imports

**Files:**
- Modify: `components/transaction/TransactionItem.tsx`
- Modify: `components/transaction/TransactionForm.tsx`

- [ ] **Step 1: Update `TransactionItem.tsx` imports**

Change line 4-5:

Old:
```typescript
import { formatCurrency } from '@/utils/currency';
import { formatDateThai } from '@/utils/date';
```

New:
```typescript
import { formatCurrency, formatDateThai } from '@/lib/utils/format';
```

- [ ] **Step 2: Update `TransactionForm.tsx` imports**

Change line 2-3:

Old:
```typescript
import { useCategoryStore } from '@/stores/categoryStore';
import { useTransactionStore } from '@/stores/transactionStore';
```

New:
```typescript
import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
```

- [ ] **Step 3: Commit**

```bash
git add components/transaction/TransactionItem.tsx components/transaction/TransactionForm.tsx
git commit -m "refactor: update transaction component imports to new paths"
```

---

### Task 12: Update `app/_layout.tsx` imports

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update imports**

Old:
```typescript
import { useDatabase } from '@/hooks/useDatabase';
import { useCategoryStore } from '@/stores/categoryStore';
import { useSettingsStore } from '@/stores/settingsStore';
```

New:
```typescript
import { useDatabase } from '@/lib/stores/db';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "refactor: update root layout imports to new paths"
```

---

### Task 13: Rename tab screens and update `app/(tabs)/_layout.tsx`

**Files:**
- Rename: `app/(tabs)/summary.tsx` → `app/(tabs)/analytics.tsx`
- Rename: `app/(tabs)/settings.tsx` → `app/(tabs)/more.tsx`
- Create: `app/(tabs)/ai-analysis.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Rename summary.tsx to analytics.tsx and update its imports**

```bash
mv "app/(tabs)/summary.tsx" "app/(tabs)/analytics.tsx"
```

Then update imports in `app/(tabs)/analytics.tsx`:

Old:
```typescript
import { useTransactionStore } from '@/stores/transactionStore';
import { BalanceCard } from '@/components/summary/BalanceCard';
import { PieChartView } from '@/components/summary/PieChartView';
import { BarChartView } from '@/components/summary/BarChartView';
import { formatMonthYearThai, shiftMonth, getCurrentMonth } from '@/utils/date';
import { getAllTransactions } from '@/db/queries/transactions';
import { getDb } from '@/hooks/useDatabase';
import { exportToCSV } from '@/utils/export';
```

New:
```typescript
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { BalanceCard } from '@/components/analytics/BalanceCard';
import { PieChartView } from '@/components/analytics/PieChartView';
import { BarChartView } from '@/components/analytics/BarChartView';
import { formatMonthYearThai, shiftMonth, getCurrentMonth } from '@/lib/utils/format';
import { getAllTransactions, getDb } from '@/lib/stores/db';
import { exportToCSV } from '@/lib/utils/export';
```

- [ ] **Step 2: Rename settings.tsx to more.tsx and update its imports**

```bash
mv "app/(tabs)/settings.tsx" "app/(tabs)/more.tsx"
```

Then update imports in `app/(tabs)/more.tsx`:

Old:
```typescript
import { useSettingsStore } from '@/stores/settingsStore';
import { getDb } from '@/hooks/useDatabase';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { getAllTransactions } from '@/db/queries/transactions';
import { exportToCSV } from '@/utils/export';
```

New:
```typescript
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getDb, getAllTransactions } from '@/lib/stores/db';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { exportToCSV } from '@/lib/utils/export';
```

- [ ] **Step 3: Create `app/(tabs)/ai-analysis.tsx` placeholder**

```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AiAnalysisScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">AI วิเคราะห์</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="sparkles-outline" size={64} color="#ccc" />
        <Text className="text-muted-foreground text-lg mt-4 font-semibold">
          เร็วๆ นี้
        </Text>
        <Text className="text-muted-foreground text-sm mt-1">
          วิเคราะห์การเงินด้วย AI
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Update `app/(tabs)/_layout.tsx` to 4 tabs**

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/layout/HapticTab';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#0891b2',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'รายการ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'สรุป',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-analysis"
        options={{
          title: 'AI วิเคราะห์',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'ตั้งค่า',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/"
git commit -m "refactor: rename tabs (summary->analytics, settings->more), add AI tab"
```

---

### Task 14: Update `app/(tabs)/index.tsx` imports

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Update imports**

Old:
```typescript
import { useTransactionStore } from '@/stores/transactionStore';
import { formatCurrency } from '@/utils/currency';
import { formatMonthYearThai, shiftMonth } from '@/utils/date';
```

New:
```typescript
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency, formatMonthYearThai, shiftMonth } from '@/lib/utils/format';
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "refactor: update index.tsx imports to new paths"
```

---

### Task 15: Create settings sub-screen placeholders

**Files:**
- Create: `app/settings/wallets.tsx`
- Create: `app/settings/categories.tsx`
- Create: `app/settings/alerts.tsx`
- Create: `app/settings/export.tsx`
- Create: `app/settings/theme.tsx`

- [ ] **Step 1: Create `app/settings/wallets.tsx`**

```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function WalletsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">จัดการกระเป๋าเงิน</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="wallet-outline" size={64} color="#ccc" />
        <Text className="text-muted-foreground text-lg mt-4">เร็วๆ นี้</Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Create `app/settings/categories.tsx`**

```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CategoriesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">จัดการหมวดหมู่</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="grid-outline" size={64} color="#ccc" />
        <Text className="text-muted-foreground text-lg mt-4">เร็วๆ นี้</Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Create `app/settings/alerts.tsx`**

```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">ตั้งเป้าใช้จ่าย</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="notifications-outline" size={64} color="#ccc" />
        <Text className="text-muted-foreground text-lg mt-4">เร็วๆ นี้</Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Create `app/settings/export.tsx`**

```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ExportScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">ส่งออกข้อมูล</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="download-outline" size={64} color="#ccc" />
        <Text className="text-muted-foreground text-lg mt-4">เร็วๆ นี้</Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Create `app/settings/theme.tsx`**

```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ThemeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">เปลี่ยนธีม</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="color-palette-outline" size={64} color="#ccc" />
        <Text className="text-muted-foreground text-lg mt-4">เร็วๆ นี้</Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/settings/
git commit -m "feat: add placeholder screens for settings sub-pages"
```

---

### Task 16: Verify and fix — TypeScript compilation check

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. If there are errors, they will be import path issues — fix each one.

- [ ] **Step 2: Run Expo start to verify app boots**

```bash
npx expo start --clear
```

Expected: App boots, shows 4 tabs, existing features (add/view/delete transactions) work.

- [ ] **Step 3: Verify old directories are fully removed**

```bash
ls -d db stores utils constants hooks/useDatabase.ts components/summary components/haptic-tab.tsx components/transactions components/wallets 2>&1
```

Expected: All paths return "No such file or directory".

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any remaining import path issues after restructure"
```

---

### Task 17: Register settings routes in root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add settings Stack.Screen entries**

In `app/_layout.tsx`, add the settings screens to the Stack navigator:

```typescript
return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings/wallets" options={{ title: 'กระเป๋าเงิน', headerBackTitle: 'กลับ' }} />
      <Stack.Screen name="settings/categories" options={{ title: 'หมวดหมู่', headerBackTitle: 'กลับ' }} />
      <Stack.Screen name="settings/alerts" options={{ title: 'เป้าใช้จ่าย', headerBackTitle: 'กลับ' }} />
      <Stack.Screen name="settings/export" options={{ title: 'ส่งออก', headerBackTitle: 'กลับ' }} />
      <Stack.Screen name="settings/theme" options={{ title: 'ธีม', headerBackTitle: 'กลับ' }} />
    </Stack>
    <StatusBar style="auto" />
  </GestureHandlerRootView>
);
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: register settings sub-screens in root Stack navigator"
```

---

### Summary of all tasks

| Task | Description | Files |
|------|------------|-------|
| 1 | Create directory structure | 10 new dirs |
| 2 | Move `id.ts` | 1 create, 1 delete |
| 3 | Merge `format.ts` | 1 create, 2 delete |
| 4 | Move `export.ts` | 1 create, 1 delete |
| 5 | Move `categories.ts` | 1 create, 2 delete |
| 6 | Merge `db.ts` | 1 create, 5 delete |
| 7 | Move stores (kebab-case) | 3 create, 3 delete |
| 8 | Move components (analytics, layout) | 4 create, 4 delete |
| 9 | Add new types | 1 modify |
| 10 | Clean up hooks | 1 verify, 2 delete |
| 11 | Update transaction component imports | 2 modify |
| 12 | Update root layout imports | 1 modify |
| 13 | Rename tabs + add AI tab | 2 rename, 2 create, 1 modify |
| 14 | Update index.tsx imports | 1 modify |
| 15 | Create settings placeholders | 5 create |
| 16 | Verify TypeScript + app boot | verification |
| 17 | Register settings routes | 1 modify |
