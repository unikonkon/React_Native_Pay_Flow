# Phase 2: Core Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add wallet system, edit transaction, calculator keypad, day-grouped SectionList, and frequent transactions to CeasFlow.

**Architecture:** Database-first approach — migrate schema, build stores, then UI. Wallet becomes a required field on transactions. Analysis store tracks duplicate transactions for "frequent" feature. Calculator keypad replaces plain text input.

**Tech Stack:** React Native + Expo, TypeScript, Zustand, expo-sqlite, NativeWind, @gorhom/bottom-sheet

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `lib/stores/wallet-store.ts` | Wallet CRUD Zustand store |
| `lib/stores/analysis-store.ts` | Duplicate detection + frequent transactions store |
| `components/common/WalletSelector.tsx` | Horizontal wallet picker for forms |
| `components/common/CalculatorPad.tsx` | Calculator keypad with basic arithmetic |
| `components/transaction/DayGroupHeader.tsx` | Section header showing date + daily totals |
| `components/transaction/FrequentTransactions.tsx` | Horizontal scroll of frequent items |

### Modified files
| File | Changes |
|------|---------|
| `lib/stores/db.ts` | Migration (wallet_id column), wallet queries, analysis queries, transaction JOIN wallet |
| `lib/stores/transaction-store.ts` | Accept walletId, integrate analysis tracking |
| `types/index.ts` | Add walletId + wallet to Transaction interface |
| `components/transaction/TransactionForm.tsx` | Edit mode, WalletSelector, CalculatorPad |
| `components/transaction/TransactionList.tsx` | FlashList to SectionList |
| `components/transaction/TransactionItem.tsx` | Show wallet color indicator |
| `app/(tabs)/index.tsx` | FrequentTransactions, edit handler, pass walletId |
| `app/settings/wallets.tsx` | Full wallet management UI |
| `app/_layout.tsx` | Load wallets + analysis on boot |

---

### Task 1: Database migration — add wallet_id to transactions + seed default wallet

**Files:**
- Modify: `lib/stores/db.ts`

- [ ] **Step 1: Add migration logic in `migrateDatabase()`**

In `lib/stores/db.ts`, add wallet_id migration and default wallet seeding after the existing migration logic. Find the `migrateDatabase` function and add after `await seedDefaultCategories(db);`:

```typescript
// Add inside migrateDatabase(), after seedDefaultCategories(db):
await migrateWalletId(db);
await seedDefaultWallet(db);
```

Add these two new functions after `seedDefaultCategories`:

```typescript
async function migrateWalletId(db: SQLiteDatabase) {
  const txCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');
  if (!txCols.some(c => c.name === 'wallet_id')) {
    await db.execAsync("ALTER TABLE transactions ADD COLUMN wallet_id TEXT DEFAULT 'wallet-cash'");
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id)');
  }
}

async function seedDefaultWallet(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM wallets WHERE id = 'wallet-cash'"
  );
  if (existing && existing.count > 0) return;

  await db.runAsync(
    `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['wallet-cash', 'เงินสด', 'cash', 'cash-outline', '#22C55E', 'THB', 0, 0, 1, new Date().toISOString()]
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/db.ts
git commit -m "feat: add wallet_id migration + seed default wallet"
```

---

### Task 2: Implement wallet DB queries

**Files:**
- Modify: `lib/stores/db.ts`

- [ ] **Step 1: Replace wallet stub functions**

Replace the entire wallet stubs section (`// ===== Wallet Queries (stubs` through the `insertWallet` function) with:

```typescript
// ===== Wallet Queries =====

export async function getAllWallets(db: SQLiteDatabase): Promise<Wallet[]> {
  const rows = await db.getAllAsync<{
    id: string; name: string; type: string; icon: string; color: string;
    currency: string; initial_balance: number; current_balance: number;
    is_asset: number; created_at: string;
  }>('SELECT * FROM wallets ORDER BY created_at');

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as WalletType,
    icon: r.icon,
    color: r.color,
    currency: r.currency,
    initialBalance: r.initial_balance,
    currentBalance: r.current_balance,
    isAsset: r.is_asset === 1,
    createdAt: r.created_at,
  }));
}

export async function insertWallet(
  db: SQLiteDatabase,
  data: { name: string; type: WalletType; icon: string; color: string }
): Promise<string> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
     VALUES (?, ?, ?, ?, ?, 'THB', 0, 0, 1, ?)`,
    [id, data.name, data.type, data.icon, data.color, createdAt]
  );

  return id;
}

export async function updateWallet(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<{ name: string; type: WalletType; icon: string; color: string }>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) { sets.push('name = ?'); values.push(updates.name); }
  if (updates.type !== undefined) { sets.push('type = ?'); values.push(updates.type); }
  if (updates.icon !== undefined) { sets.push('icon = ?'); values.push(updates.icon); }
  if (updates.color !== undefined) { sets.push('color = ?'); values.push(updates.color); }

  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE wallets SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteWallet(db: SQLiteDatabase, id: string): Promise<void> {
  if (id === 'wallet-cash') return; // Cannot delete default wallet
  await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
}

export async function getWalletTransactionCount(db: SQLiteDatabase, walletId: string): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE wallet_id = ?',
    [walletId]
  );
  return result?.count ?? 0;
}
```

- [ ] **Step 2: Add `WalletType` to the import at the top of db.ts**

Change:
```typescript
import type { Category, Transaction, TransactionType } from '@/types';
```
To:
```typescript
import type { Category, Transaction, TransactionType, Wallet, WalletType } from '@/types';
```

- [ ] **Step 3: Commit**

```bash
git add lib/stores/db.ts
git commit -m "feat: implement wallet CRUD queries in db.ts"
```

---

### Task 3: Update transaction queries to include wallet JOIN

**Files:**
- Modify: `lib/stores/db.ts`

- [ ] **Step 1: Update `getTransactionsByMonth` to JOIN wallets**

Replace the `getTransactionsByMonth` function:

```typescript
export async function getTransactionsByMonth(db: SQLiteDatabase, month: string): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; wallet_id: string;
    note: string | null; date: string; created_at: string;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
    cat_is_custom: number; cat_sort_order: number;
    w_name: string | null; w_type: string | null; w_icon: string | null; w_color: string | null;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
            c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order,
            w.name as w_name, w.type as w_type, w.icon as w_icon, w.color as w_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     WHERE strftime('%Y-%m', t.date) = ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [month]
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
    walletId: r.wallet_id ?? 'wallet-cash',
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
    wallet: r.w_name ? {
      id: r.wallet_id,
      name: r.w_name,
      type: r.w_type as WalletType,
      icon: r.w_icon!,
      color: r.w_color!,
      currency: 'THB',
      initialBalance: 0,
      currentBalance: 0,
      isAsset: true,
      createdAt: '',
    } : undefined,
  }));
}
```

- [ ] **Step 2: Update `getAllTransactions` similarly**

Replace the `getAllTransactions` function:

```typescript
export async function getAllTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; wallet_id: string;
    note: string | null; date: string; created_at: string;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
    cat_is_custom: number; cat_sort_order: number;
    w_name: string | null; w_type: string | null; w_icon: string | null; w_color: string | null;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
            c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order,
            w.name as w_name, w.type as w_type, w.icon as w_icon, w.color as w_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     ORDER BY t.date DESC, t.created_at DESC`
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
    walletId: r.wallet_id ?? 'wallet-cash',
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
    wallet: r.w_name ? {
      id: r.wallet_id,
      name: r.w_name,
      type: r.w_type as WalletType,
      icon: r.w_icon!,
      color: r.w_color!,
      currency: 'THB',
      initialBalance: 0,
      currentBalance: 0,
      isAsset: true,
      createdAt: '',
    } : undefined,
  }));
}
```

- [ ] **Step 3: Update `insertTransaction` to accept walletId**

Replace the `insertTransaction` function:

```typescript
export async function insertTransaction(
  db: SQLiteDatabase,
  data: { type: TransactionType; amount: number; categoryId: string; walletId?: string; note?: string; date: string }
) {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category_id, wallet_id, note, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.type, data.amount, data.categoryId, data.walletId ?? 'wallet-cash', data.note ?? null, data.date, createdAt]
  );

  return id;
}
```

- [ ] **Step 4: Update `updateTransaction` to accept walletId**

Replace the `updateTransaction` function:

```typescript
export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  data: Partial<{ type: TransactionType; amount: number; categoryId: string; walletId: string; note: string; date: string }>
) {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.amount !== undefined) { sets.push('amount = ?'); values.push(data.amount); }
  if (data.categoryId !== undefined) { sets.push('category_id = ?'); values.push(data.categoryId); }
  if (data.walletId !== undefined) { sets.push('wallet_id = ?'); values.push(data.walletId); }
  if (data.note !== undefined) { sets.push('note = ?'); values.push(data.note); }
  if (data.date !== undefined) { sets.push('date = ?'); values.push(data.date); }

  if (sets.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`, values);
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/stores/db.ts
git commit -m "feat: add wallet JOIN to transaction queries + walletId support"
```

---

### Task 4: Implement analysis DB queries

**Files:**
- Modify: `lib/stores/db.ts`

- [ ] **Step 1: Replace analysis stub functions**

Replace the analysis stubs section with:

```typescript
// ===== Analysis Queries =====

export async function findAnalysisMatch(
  db: SQLiteDatabase,
  data: { walletId: string; categoryId: string; type: TransactionType; amount: number; note?: string }
): Promise<{ id: string; matchType: 'basic' | 'full'; count: number } | null> {
  // Try full match first
  if (data.note) {
    const full = await db.getFirstAsync<{ id: string; count: number }>(
      `SELECT id, count FROM analysis
       WHERE wallet_id = ? AND category_id = ? AND type = ? AND amount = ? AND note = ? AND match_type = 'full'`,
      [data.walletId, data.categoryId, data.type, data.amount, data.note]
    );
    if (full) return { id: full.id, matchType: 'full', count: full.count };
  }

  // Try basic match
  const basic = await db.getFirstAsync<{ id: string; count: number }>(
    `SELECT id, count FROM analysis
     WHERE wallet_id = ? AND category_id = ? AND type = ? AND amount = ? AND match_type = 'basic'`,
    [data.walletId, data.categoryId, data.type, data.amount]
  );
  if (basic) return { id: basic.id, matchType: 'basic', count: basic.count };

  return null;
}

export async function upsertAnalysis(
  db: SQLiteDatabase,
  data: { walletId: string; categoryId: string; type: TransactionType; amount: number; note?: string; transactionId: string },
  matchType: 'basic' | 'full'
): Promise<void> {
  const now = new Date().toISOString();
  const match = await findAnalysisMatch(db, data);

  if (match) {
    await db.runAsync(
      `UPDATE analysis SET count = count + 1, last_transaction_id = ?, updated_at = ? WHERE id = ?`,
      [data.transactionId, now, match.id]
    );
  } else {
    const id = generateId();
    await db.runAsync(
      `INSERT INTO analysis (id, wallet_id, type, category_id, amount, note, match_type, count, last_transaction_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [id, data.walletId, data.type, data.categoryId, data.amount, data.note ?? null, matchType, data.transactionId, now, now]
    );
  }
}

export async function getTopAnalyses(db: SQLiteDatabase, limit: number = 6): Promise<Analysis[]> {
  const rows = await db.getAllAsync<{
    id: string; wallet_id: string; type: string; category_id: string;
    amount: number; note: string | null; match_type: string;
    count: number; last_transaction_id: string;
    created_at: string; updated_at: string;
  }>(
    'SELECT * FROM analysis WHERE count >= 2 ORDER BY count DESC LIMIT ?',
    [limit]
  );

  return rows.map(r => ({
    id: r.id,
    walletId: r.wallet_id,
    type: r.type as TransactionType,
    categoryId: r.category_id,
    amount: r.amount,
    note: r.note ?? undefined,
    matchType: r.match_type as MatchType,
    count: r.count,
    lastTransactionId: r.last_transaction_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function deleteAnalysisByWalletId(db: SQLiteDatabase, walletId: string): Promise<void> {
  await db.runAsync('DELETE FROM analysis WHERE wallet_id = ?', [walletId]);
}
```

- [ ] **Step 2: Add `Analysis` and `MatchType` to the import**

Change:
```typescript
import type { Category, Transaction, TransactionType, Wallet, WalletType } from '@/types';
```
To:
```typescript
import type { Analysis, Category, MatchType, Transaction, TransactionType, Wallet, WalletType } from '@/types';
```

- [ ] **Step 3: Commit**

```bash
git add lib/stores/db.ts
git commit -m "feat: implement analysis queries (find, upsert, top, delete)"
```

---

### Task 5: Update Transaction type + transaction-store

**Files:**
- Modify: `types/index.ts`
- Modify: `lib/stores/transaction-store.ts`

- [ ] **Step 1: Add walletId to Transaction interface in `types/index.ts`**

Change the Transaction interface:

```typescript
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
```

- [ ] **Step 2: Update `transaction-store.ts` to accept walletId**

Replace the entire file content:

```typescript
import { create } from 'zustand';
import type { Transaction, TransactionType } from '@/types';
import {
  getDb,
  getTransactionsByMonth,
  insertTransaction,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  upsertAnalysis,
  findAnalysisMatch,
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

    // Track for frequent transactions
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
```

- [ ] **Step 3: Commit**

```bash
git add types/index.ts lib/stores/transaction-store.ts
git commit -m "feat: add walletId to Transaction type + analysis tracking in store"
```

---

### Task 6: Create wallet-store

**Files:**
- Create: `lib/stores/wallet-store.ts`

- [ ] **Step 1: Create `lib/stores/wallet-store.ts`**

```typescript
import { create } from 'zustand';
import type { Wallet, WalletType } from '@/types';
import {
  getDb,
  getAllWallets,
  insertWallet,
  updateWallet as updateW,
  deleteWallet as deleteW,
  getWalletTransactionCount,
} from '@/lib/stores/db';

interface WalletStore {
  wallets: Wallet[];
  isLoading: boolean;
  isInitialized: boolean;

  loadWallets: () => Promise<void>;
  getWalletById: (id: string) => Wallet | undefined;
  addWallet: (data: { name: string; type: WalletType; icon: string; color: string }) => Promise<void>;
  updateWallet: (id: string, updates: Partial<{ name: string; type: WalletType; icon: string; color: string }>) => Promise<void>;
  deleteWallet: (id: string) => Promise<boolean>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  isLoading: false,
  isInitialized: false,

  loadWallets: async () => {
    set({ isLoading: true });
    const db = getDb();
    const wallets = await getAllWallets(db);
    set({ wallets, isLoading: false, isInitialized: true });
  },

  getWalletById: (id) => {
    return get().wallets.find(w => w.id === id);
  },

  addWallet: async (data) => {
    const db = getDb();
    await insertWallet(db, data);
    await get().loadWallets();
  },

  updateWallet: async (id, updates) => {
    const db = getDb();
    await updateW(db, id, updates);
    await get().loadWallets();
  },

  deleteWallet: async (id) => {
    if (id === 'wallet-cash') return false;
    const db = getDb();
    const count = await getWalletTransactionCount(db, id);
    if (count > 0) return false;
    await deleteW(db, id);
    await get().loadWallets();
    return true;
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/wallet-store.ts
git commit -m "feat: create wallet Zustand store"
```

---

### Task 7: Create analysis-store

**Files:**
- Create: `lib/stores/analysis-store.ts`

- [ ] **Step 1: Create `lib/stores/analysis-store.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/analysis-store.ts
git commit -m "feat: create analysis Zustand store"
```

---

### Task 8: Update app/_layout.tsx to load wallets + analysis

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update `app/_layout.tsx`**

Add imports and load calls:

```typescript
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDatabase } from '@/lib/stores/db';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import 'react-native-reanimated';
import '@/global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { isReady } = useDatabase();
  const loadCategories = useCategoryStore(s => s.loadCategories);
  const loadSettings = useSettingsStore(s => s.loadSettings);
  const loadWallets = useWalletStore(s => s.loadWallets);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);

  useEffect(() => {
    if (isReady) {
      loadCategories();
      loadSettings();
      loadWallets();
      loadAnalysis();
    }
  }, [isReady, loadCategories, loadSettings, loadWallets, loadAnalysis]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: load wallets and analysis stores on app boot"
```

---

### Task 9: Create WalletSelector component

**Files:**
- Create: `components/common/WalletSelector.tsx`

- [ ] **Step 1: Create `components/common/WalletSelector.tsx`**

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Wallet } from '@/types';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedId?: string;
  onSelect: (wallet: Wallet) => void;
}

export function WalletSelector({ wallets, selectedId, onSelect }: WalletSelectorProps) {
  return (
    <View className="mb-4">
      <Text className="text-foreground font-semibold mb-2">กระเป๋าเงิน</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {wallets.map((wallet) => {
            const isSelected = wallet.id === selectedId;
            return (
              <Pressable
                key={wallet.id}
                onPress={() => onSelect(wallet)}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <View
                  className="w-7 h-7 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: wallet.color }}
                >
                  <Ionicons name={wallet.icon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
                </View>
                <Text className={`text-sm ${isSelected ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {wallet.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Remove .gitkeep from components/common/**

```bash
rm -f components/common/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add components/common/
git commit -m "feat: create WalletSelector component"
```

---

### Task 10: Create CalculatorPad component

**Files:**
- Create: `components/common/CalculatorPad.tsx`

- [ ] **Step 1: Create `components/common/CalculatorPad.tsx`**

```typescript
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import type { TransactionType } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface CalculatorPadProps {
  value: number;
  onChange: (value: number) => void;
  type: TransactionType;
}

const BUTTONS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['.', '0', '⌫', '+'],
];

export function CalculatorPad({ value, onChange, type }: CalculatorPadProps) {
  const [expression, setExpression] = useState(value > 0 ? String(value) : '');
  const [hasOperator, setHasOperator] = useState(false);

  const colorClass = type === 'income' ? 'text-income' : 'text-expense';

  const evaluate = useCallback((expr: string): number => {
    try {
      // Replace display operators with JS operators
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      // Only allow digits, operators, and decimal points
      if (!/^[\d+\-*/.]+$/.test(sanitized)) return 0;
      const result = Function('"use strict"; return (' + sanitized + ')')();
      return typeof result === 'number' && isFinite(result) ? Math.round(result * 100) / 100 : 0;
    } catch {
      return 0;
    }
  }, []);

  const handlePress = useCallback((btn: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (btn === '⌫') {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      if (!newExpr.match(/[+\-×÷]/)) setHasOperator(false);
      onChange(evaluate(newExpr) || 0);
      return;
    }

    if (['+', '-', '×', '÷'].includes(btn)) {
      if (expression === '' || /[+\-×÷]$/.test(expression)) return;
      if (hasOperator) {
        // Evaluate current expression first
        const result = evaluate(expression);
        const newExpr = String(result) + btn;
        setExpression(newExpr);
        onChange(result);
      } else {
        setExpression(expression + btn);
      }
      setHasOperator(true);
      return;
    }

    if (btn === '.') {
      const parts = expression.split(/[+\-×÷]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) return;
    }

    // Limit decimal places
    if (btn !== '.') {
      const parts = expression.split(/[+\-×÷]/);
      const lastPart = parts[parts.length - 1];
      const decIdx = lastPart.indexOf('.');
      if (decIdx !== -1 && lastPart.length - decIdx > 2) return;
    }

    const newExpr = expression + btn;
    setExpression(newExpr);

    if (!hasOperator) {
      onChange(evaluate(newExpr));
    }
  }, [expression, hasOperator, evaluate, onChange]);

  const handleEquals = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = evaluate(expression);
    setExpression(result > 0 ? String(result) : '');
    setHasOperator(false);
    onChange(result);
  }, [expression, evaluate, onChange]);

  return (
    <View className="mb-4">
      {/* Display */}
      <View className="border-b-2 border-border pb-2 mb-3">
        <Text className="text-muted-foreground text-xs mb-1">
          {hasOperator ? expression : ''}
        </Text>
        <Text className={`text-3xl font-bold ${colorClass}`}>
          {value > 0 ? formatCurrency(value) : '฿0'}
        </Text>
      </View>

      {/* Keypad */}
      {BUTTONS.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row mb-1">
          {row.map((btn) => {
            const isOperator = ['+', '-', '×', '÷'].includes(btn);
            const isBackspace = btn === '⌫';
            return (
              <Pressable
                key={btn}
                onPress={() => handlePress(btn)}
                className={`flex-1 mx-0.5 py-3 rounded-lg items-center justify-center ${
                  isOperator ? 'bg-primary/10' : 'bg-secondary'
                }`}
              >
                {isBackspace ? (
                  <Ionicons name="backspace-outline" size={22} color="#666" />
                ) : (
                  <Text className={`text-lg font-semibold ${isOperator ? 'text-primary' : 'text-foreground'}`}>
                    {btn}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Equals */}
      <Pressable
        onPress={handleEquals}
        className="mt-1 py-3 rounded-lg items-center bg-primary/20"
      >
        <Text className="text-primary text-lg font-bold">=</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/common/CalculatorPad.tsx
git commit -m "feat: create CalculatorPad component with basic arithmetic"
```

---

### Task 11: Create DayGroupHeader component

**Files:**
- Create: `components/transaction/DayGroupHeader.tsx`

- [ ] **Step 1: Create `components/transaction/DayGroupHeader.tsx`**

```typescript
import { View, Text } from 'react-native';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';

interface DayGroupHeaderProps {
  date: string;
  income: number;
  expense: number;
}

export function DayGroupHeader({ date, income, expense }: DayGroupHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 bg-background">
      <Text className="text-muted-foreground text-sm font-semibold">
        {formatRelativeDate(date)}
      </Text>
      <View className="flex-row gap-3">
        {income > 0 && (
          <Text className="text-income text-xs font-medium">+{formatCurrency(income)}</Text>
        )}
        {expense > 0 && (
          <Text className="text-expense text-xs font-medium">-{formatCurrency(expense)}</Text>
        )}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/transaction/DayGroupHeader.tsx
git commit -m "feat: create DayGroupHeader component"
```

---

### Task 12: Update TransactionList to SectionList with day grouping

**Files:**
- Modify: `components/transaction/TransactionList.tsx`

- [ ] **Step 1: Rewrite TransactionList.tsx**

Replace entire file:

```typescript
import { SectionList, type SectionListData } from 'react-native';
import { useMemo } from 'react';
import type { Transaction } from '@/types';
import { TransactionItem } from './TransactionItem';
import { DayGroupHeader } from './DayGroupHeader';
import { EmptyState } from '@/components/ui/EmptyState';

interface TransactionListProps {
  transactions: Transaction[];
  onItemPress?: (item: Transaction) => void;
  onItemLongPress?: (item: Transaction) => void;
}

interface DaySection {
  date: string;
  income: number;
  expense: number;
  data: Transaction[];
}

export function TransactionList({ transactions, onItemPress, onItemLongPress }: TransactionListProps) {
  const sections: DaySection[] = useMemo(() => {
    const map = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      const day = tx.date;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(tx);
    }

    return Array.from(map.entries()).map(([date, txs]) => ({
      date,
      income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      data: txs,
    }));
  }, [transactions]);

  if (transactions.length === 0) {
    return <EmptyState title="ยังไม่มีรายการ" subtitle="กดปุ่ม + เพื่อเพิ่มรายการ" />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TransactionItem
          item={item}
          onPress={onItemPress}
          onLongPress={onItemLongPress}
        />
      )}
      renderSectionHeader={({ section }) => (
        <DayGroupHeader
          date={section.date}
          income={section.income}
          expense={section.expense}
        />
      )}
      stickySectionHeadersEnabled={false}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/transaction/TransactionList.tsx
git commit -m "feat: replace FlashList with SectionList day grouping"
```

---

### Task 13: Create FrequentTransactions component

**Files:**
- Create: `components/transaction/FrequentTransactions.tsx`

- [ ] **Step 1: Create `components/transaction/FrequentTransactions.tsx`**

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Analysis, Category } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import * as Haptics from 'expo-haptics';

interface FrequentTransactionsProps {
  analyses: Analysis[];
  categories: Category[];
  onSelect: (analysis: Analysis) => void;
}

export function FrequentTransactions({ analyses, categories, onSelect }: FrequentTransactionsProps) {
  if (analyses.length === 0) return null;

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const handleSelect = (analysis: Analysis) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(analysis);
  };

  return (
    <View className="px-4 py-3 bg-card border-b border-border">
      <Text className="text-muted-foreground text-xs font-semibold mb-2">รายการใช้บ่อย</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {analyses.map((analysis) => {
            const cat = getCategoryById(analysis.categoryId);
            return (
              <Pressable
                key={analysis.id}
                onPress={() => handleSelect(analysis)}
                className="items-center w-16"
              >
                <View
                  className="w-11 h-11 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: cat?.color ?? '#999' }}
                >
                  <Ionicons
                    name={(cat?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color="white"
                  />
                </View>
                <Text className="text-foreground text-xs text-center" numberOfLines={1}>
                  {cat?.name ?? 'อื่นๆ'}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {formatCurrency(analysis.amount)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/transaction/FrequentTransactions.tsx
git commit -m "feat: create FrequentTransactions component"
```

---

### Task 14: Update TransactionForm with edit mode, WalletSelector, and CalculatorPad

**Files:**
- Modify: `components/transaction/TransactionForm.tsx`

- [ ] **Step 1: Rewrite TransactionForm.tsx**

Replace entire file:

```typescript
import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import type { Category, Transaction, TransactionType, Wallet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import { CategoryPicker } from './CategoryPicker';
import { WalletSelector } from '@/components/common/WalletSelector';
import { CalculatorPad } from '@/components/common/CalculatorPad';

interface TransactionFormProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  editTransaction?: Transaction | null;
  onDismiss?: () => void;
}

export function TransactionForm({ bottomSheetRef, editTransaction, onDismiss }: TransactionFormProps) {
  const snapPoints = useMemo(() => ['85%'], []);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEditMode = !!editTransaction;

  const categories = useCategoryStore(s => s.categories);
  const wallets = useWalletStore(s => s.wallets);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const updateTransaction = useTransactionStore(s => s.updateTransaction);

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === type),
    [categories, type]
  );

  // Pre-fill when editing
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount);
      setSelectedCategory(editTransaction.category ?? null);
      setSelectedWallet(wallets.find(w => w.id === editTransaction.walletId) ?? null);
      setDate(new Date(editTransaction.date));
      setNote(editTransaction.note ?? '');
    }
  }, [editTransaction, wallets]);

  const resetForm = useCallback(() => {
    setType('expense');
    setAmount(0);
    setSelectedCategory(null);
    setSelectedWallet(null);
    setDate(new Date());
    setNote('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!amount || !selectedCategory) return;

    if (isEditMode && editTransaction) {
      await updateTransaction(editTransaction.id, {
        type,
        amount,
        categoryId: selectedCategory.id,
        walletId: selectedWallet?.id ?? 'wallet-cash',
        note: note.trim() || undefined,
        date: date.toISOString().split('T')[0],
      });
    } else {
      await addTransaction({
        type,
        amount,
        categoryId: selectedCategory.id,
        walletId: selectedWallet?.id ?? 'wallet-cash',
        note: note.trim() || undefined,
        date: date.toISOString().split('T')[0],
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    onDismiss?.();
    bottomSheetRef.current?.close();
  }, [amount, selectedCategory, selectedWallet, type, note, date, isEditMode, editTransaction, addTransaction, updateTransaction, resetForm, onDismiss, bottomSheetRef]);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const toggleType = (newType: TransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    Haptics.selectionAsync();
  };

  const handleClose = useCallback(() => {
    if (!isEditMode) resetForm();
    onDismiss?.();
  }, [isEditMode, resetForm, onDismiss]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      handleIndicatorStyle={{ backgroundColor: '#ccc' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <Text className="text-foreground text-lg font-bold mb-4 text-center">
            {isEditMode ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}
          </Text>

          {/* Type Toggle */}
          <View className="flex-row mb-4 rounded-xl overflow-hidden border border-border">
            <Pressable
              onPress={() => toggleType('expense')}
              className={`flex-1 py-3 items-center ${type === 'expense' ? 'bg-expense' : 'bg-card'}`}
            >
              <Text className={`font-bold ${type === 'expense' ? 'text-white' : 'text-foreground'}`}>
                รายจ่าย
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleType('income')}
              className={`flex-1 py-3 items-center ${type === 'income' ? 'bg-income' : 'bg-card'}`}
            >
              <Text className={`font-bold ${type === 'income' ? 'text-white' : 'text-foreground'}`}>
                รายรับ
              </Text>
            </Pressable>
          </View>

          {/* Calculator */}
          <CalculatorPad value={amount} onChange={setAmount} type={type} />

          {/* Wallet Selector */}
          <WalletSelector
            wallets={wallets}
            selectedId={selectedWallet?.id}
            onSelect={setSelectedWallet}
          />

          {/* Category */}
          <CategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategory?.id}
            onSelect={setSelectedCategory}
          />

          {/* Date */}
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center py-3 px-4 bg-secondary rounded-xl mb-4"
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text className="text-foreground ml-2">
              {date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              locale="th-TH"
            />
          )}

          {/* Note */}
          <View className="mb-6">
            <Text className="text-foreground font-semibold mb-2">หมายเหตุ</Text>
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)"
              placeholderTextColor="#999"
              style={{
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-xl items-center ${
              type === 'income' ? 'bg-income' : 'bg-expense'
            } ${!amount || !selectedCategory ? 'opacity-50' : ''}`}
            disabled={!amount || !selectedCategory}
          >
            <Text className="text-white font-bold text-lg">
              {isEditMode ? 'อัพเดท' : 'บันทึก'}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/transaction/TransactionForm.tsx
git commit -m "feat: add edit mode, WalletSelector, CalculatorPad to TransactionForm"
```

---

### Task 15: Update HomeScreen (index.tsx) with edit + frequent transactions

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Rewrite `app/(tabs)/index.tsx`**

Replace entire file:

```typescript
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { TransactionList } from '@/components/transaction/TransactionList';
import { FrequentTransactions } from '@/components/transaction/FrequentTransactions';
import { FAB } from '@/components/ui/FAB';
import { useSummary } from '@/hooks/useSummary';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import type { Analysis, Transaction } from '@/types';
import { formatCurrency, formatMonthYearThai, shiftMonth } from '@/lib/utils/format';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const {
    transactions,
    currentMonth,
    setCurrentMonth,
    loadTransactions,
    deleteTransaction,
  } = useTransactionStore();

  const categories = useCategoryStore(s => s.categories);
  const { analyses, loadAnalysis } = useAnalysisStore();
  const { totalIncome, totalExpense } = useSummary(transactions);

  useEffect(() => {
    loadTransactions(currentMonth);
  }, [currentMonth, loadTransactions]);

  const handlePrevMonth = () => setCurrentMonth(shiftMonth(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(shiftMonth(currentMonth, 1));

  const handleItemPress = useCallback((item: Transaction) => {
    setEditingTransaction(item);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleItemLongPress = useCallback((item: Transaction) => {
    Alert.alert(
      'ลบรายการ',
      `ต้องการลบ "${item.category?.name}" ${formatCurrency(item.amount)} ?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => deleteTransaction(item.id),
        },
      ]
    );
  }, [deleteTransaction]);

  const handleAddNew = useCallback(() => {
    setEditingTransaction(null);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleFrequentSelect = useCallback((analysis: Analysis) => {
    // Pre-fill a new transaction from frequent data
    const cat = categories.find(c => c.id === analysis.categoryId);
    setEditingTransaction({
      id: '', // empty id = new transaction (not edit)
      type: analysis.type,
      amount: analysis.amount,
      categoryId: analysis.categoryId,
      walletId: analysis.walletId,
      category: cat,
      note: analysis.note,
      date: new Date().toISOString().split('T')[0],
      createdAt: '',
    });
    bottomSheetRef.current?.snapToIndex(0);
  }, [categories]);

  const handleFormDismiss = useCallback(() => {
    setEditingTransaction(null);
    loadAnalysis();
  }, [loadAnalysis]);

  // For frequent: pass null editTransaction when id is empty (pre-fill mode = add mode)
  const formEditTransaction = editingTransaction?.id ? editingTransaction : null;
  const formPrefill = editingTransaction?.id === '' ? editingTransaction : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Month Selector + Quick Summary */}
      <View className="px-4 pt-2 pb-3 bg-card border-b border-border">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={handlePrevMonth} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#666" />
          </Pressable>
          <Text className="text-foreground font-bold text-lg">
            {formatMonthYearThai(currentMonth)}
          </Text>
          <Pressable onPress={handleNextMonth} className="p-2">
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </Pressable>
        </View>

        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">รายรับ</Text>
            <Text className="text-income font-bold text-base">{formatCurrency(totalIncome)}</Text>
          </View>
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">รายจ่าย</Text>
            <Text className="text-expense font-bold text-base">{formatCurrency(totalExpense)}</Text>
          </View>
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">คงเหลือ</Text>
            <Text className={`font-bold text-base ${totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Frequent Transactions */}
      <FrequentTransactions
        analyses={analyses}
        categories={categories}
        onSelect={handleFrequentSelect}
      />

      {/* Transaction List */}
      <View className="flex-1">
        <TransactionList
          transactions={transactions}
          onItemPress={handleItemPress}
          onItemLongPress={handleItemLongPress}
        />
      </View>

      {/* FAB */}
      <FAB onPress={handleAddNew} />

      {/* Bottom Sheet Form */}
      <TransactionForm
        bottomSheetRef={bottomSheetRef}
        editTransaction={formEditTransaction}
        onDismiss={handleFormDismiss}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: add edit transaction, frequent transactions to HomeScreen"
```

---

### Task 16: Build wallet management screen

**Files:**
- Modify: `app/settings/wallets.tsx`

- [ ] **Step 1: Rewrite `app/settings/wallets.tsx`**

Replace entire file:

```typescript
import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/lib/stores/wallet-store';
import type { Wallet, WalletType } from '@/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

const WALLET_TYPES: { value: WalletType; label: string; icon: string }[] = [
  { value: 'cash', label: 'เงินสด', icon: 'cash-outline' },
  { value: 'bank', label: 'ธนาคาร', icon: 'business-outline' },
  { value: 'credit_card', label: 'บัตรเครดิต', icon: 'card-outline' },
  { value: 'e_wallet', label: 'E-Wallet', icon: 'phone-portrait-outline' },
  { value: 'savings', label: 'บัญชีออมทรัพย์', icon: 'wallet-outline' },
  { value: 'daily_expense', label: 'ค่าใช้จ่ายรายวัน', icon: 'today-outline' },
];

const WALLET_COLORS = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export default function WalletsScreen() {
  const { wallets, addWallet, updateWallet, deleteWallet } = useWalletStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<WalletType>('cash');
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);

  const isEditing = !!editingWallet;

  const resetForm = useCallback(() => {
    setEditingWallet(null);
    setName('');
    setSelectedType('cash');
    setSelectedColor(WALLET_COLORS[0]);
  }, []);

  const openAddForm = useCallback(() => {
    resetForm();
    bottomSheetRef.current?.snapToIndex(0);
  }, [resetForm]);

  const openEditForm = useCallback((wallet: Wallet) => {
    if (wallet.id === 'wallet-cash') return; // Cannot edit default
    setEditingWallet(wallet);
    setName(wallet.name);
    setSelectedType(wallet.type);
    setSelectedColor(wallet.color);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    const typeInfo = WALLET_TYPES.find(t => t.value === selectedType)!;

    if (isEditing && editingWallet) {
      await updateWallet(editingWallet.id, {
        name: name.trim(),
        type: selectedType,
        icon: typeInfo.icon,
        color: selectedColor,
      });
    } else {
      await addWallet({
        name: name.trim(),
        type: selectedType,
        icon: typeInfo.icon,
        color: selectedColor,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    bottomSheetRef.current?.close();
  }, [name, selectedType, selectedColor, isEditing, editingWallet, addWallet, updateWallet, resetForm]);

  const handleDelete = useCallback((wallet: Wallet) => {
    if (wallet.id === 'wallet-cash') return;
    Alert.alert(
      'ลบกระเป๋าเงิน',
      `ต้องการลบ "${wallet.name}" ?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteWallet(wallet.id);
            if (!success) {
              Alert.alert('ไม่สามารถลบได้', 'กระเป๋านี้มีรายการอยู่ ต้องลบรายการก่อน');
            }
          },
        },
      ]
    );
  }, [deleteWallet]);

  const renderWalletItem = ({ item }: { item: Wallet }) => {
    const isDefault = item.id === 'wallet-cash';
    return (
      <Pressable
        onPress={() => openEditForm(item)}
        onLongPress={() => handleDelete(item)}
        className="flex-row items-center px-4 py-4 bg-card border-b border-border"
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: item.color }}
        >
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-medium text-base">{item.name}</Text>
          <Text className="text-muted-foreground text-xs">
            {WALLET_TYPES.find(t => t.value === item.type)?.label ?? item.type}
          </Text>
        </View>
        {isDefault && (
          <View className="bg-primary/10 px-2 py-1 rounded">
            <Text className="text-primary text-xs">ค่าเริ่มต้น</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id}
        renderItem={renderWalletItem}
      />

      {/* Add Button */}
      <Pressable
        onPress={openAddForm}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      {/* Add/Edit Form */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={resetForm}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-foreground text-lg font-bold mb-4 text-center">
            {isEditing ? 'แก้ไขกระเป๋าเงิน' : 'เพิ่มกระเป๋าเงิน'}
          </Text>

          {/* Name */}
          <Text className="text-foreground font-semibold mb-2">ชื่อ</Text>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder="ชื่อกระเป๋าเงิน"
            placeholderTextColor="#999"
            style={{
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 12,
              padding: 12,
              fontSize: 16,
              marginBottom: 16,
            }}
          />

          {/* Type */}
          <Text className="text-foreground font-semibold mb-2">ประเภท</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {WALLET_TYPES.map((wt) => (
              <Pressable
                key={wt.value}
                onPress={() => setSelectedType(wt.value)}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  selectedType === wt.value ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <Ionicons name={wt.icon as keyof typeof Ionicons.glyphMap} size={16} color={selectedType === wt.value ? '#0891b2' : '#666'} />
                <Text className={`text-sm ml-1 ${selectedType === wt.value ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {wt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Color */}
          <Text className="text-foreground font-semibold mb-2">สี</Text>
          <View className="flex-row gap-3 mb-6">
            {WALLET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  selectedColor === color ? 'border-2 border-foreground' : ''
                }`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={18} color="white" />
                )}
              </Pressable>
            ))}
          </View>

          {/* Save */}
          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-xl items-center bg-primary ${!name.trim() ? 'opacity-50' : ''}`}
            disabled={!name.trim()}
          >
            <Text className="text-white font-bold text-lg">
              {isEditing ? 'อัพเดท' : 'เพิ่ม'}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/settings/wallets.tsx
git commit -m "feat: implement wallet management screen with add/edit/delete"
```

---

### Task 17: Verify TypeScript compilation + cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. Fix any that appear.

- [ ] **Step 2: Verify FlashList dependency can be removed**

Check if FlashList is still used anywhere:

```bash
grep -r "FlashList\|@shopify/flash-list" --include="*.ts" --include="*.tsx" app/ components/ lib/
```

If no results, it's safe to leave in package.json for now (removing dependencies is a separate task).

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors from Phase 2 changes"
```

---

### Summary

| Task | Description | Files |
|------|------------|-------|
| 1 | DB migration: wallet_id + seed default wallet | db.ts |
| 2 | Wallet CRUD queries | db.ts |
| 3 | Transaction queries with wallet JOIN | db.ts |
| 4 | Analysis queries | db.ts |
| 5 | Transaction type + store update | types/index.ts, transaction-store.ts |
| 6 | Wallet store | wallet-store.ts (new) |
| 7 | Analysis store | analysis-store.ts (new) |
| 8 | App boot: load wallets + analysis | _layout.tsx |
| 9 | WalletSelector component | WalletSelector.tsx (new) |
| 10 | CalculatorPad component | CalculatorPad.tsx (new) |
| 11 | DayGroupHeader component | DayGroupHeader.tsx (new) |
| 12 | SectionList with day grouping | TransactionList.tsx |
| 13 | FrequentTransactions component | FrequentTransactions.tsx (new) |
| 14 | TransactionForm: edit + wallet + calculator | TransactionForm.tsx |
| 15 | HomeScreen: edit + frequent | index.tsx |
| 16 | Wallet management screen | wallets.tsx |
| 17 | TypeScript verification | all |
