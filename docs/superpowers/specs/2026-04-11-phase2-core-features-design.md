# Phase 2: Core Features — Design Spec

**Date:** 2026-04-11
**Scope:** Wallet system, Edit transaction, Calculator keypad, SectionList, Analysis/Frequent transactions
**Prerequisite:** Restructure complete (Phase 1)

---

## 1. Wallet System

### 1.1 Database Migration

Add `wallet_id` column to transactions table and seed default wallet:

```sql
ALTER TABLE transactions ADD COLUMN wallet_id TEXT DEFAULT 'wallet-cash';

INSERT OR IGNORE INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
VALUES ('wallet-cash', 'เงินสด', 'cash', 'cash-outline', '#22C55E', 'THB', 0, 0, 1, datetime('now'));
```

All existing transactions automatically get `wallet_id = 'wallet-cash'` via DEFAULT.

Migration runs in `migrateDatabase()` in `lib/stores/db.ts` — check if `wallet_id` column exists in transactions, if not run ALTER TABLE + seed.

### 1.2 Default Wallet

Only one default wallet is seeded:

```typescript
{
  id: 'wallet-cash',
  name: 'เงินสด',
  type: 'cash',
  icon: 'cash-outline',
  color: '#22C55E',
  currency: 'THB',
  initialBalance: 0,
  currentBalance: 0,
  isAsset: true,
}
```

Users create additional wallets themselves (bank, credit_card, e_wallet, savings, daily_expense).

### 1.3 Wallet Store (`lib/stores/wallet-store.ts`)

```typescript
interface WalletStore {
  wallets: Wallet[];
  isLoading: boolean;
  isInitialized: boolean;

  loadWallets: () => Promise<void>;
  getWalletById: (id: string) => Wallet | undefined;
  addWallet: (data: { name: string; type: WalletType; icon: string; color: string }) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
}
```

- `deleteWallet` must NOT delete wallet with id `'wallet-cash'` (default wallet)
- `deleteWallet` should also delete all transactions with that `walletId` (or block deletion if transactions exist — block is safer)

### 1.4 Wallet DB Queries (`lib/stores/db.ts`)

Replace stub functions with real implementations:

```typescript
export async function getAllWallets(db): Promise<Wallet[]>
export async function insertWallet(db, data): Promise<string>
export async function updateWallet(db, id, updates): Promise<void>
export async function deleteWallet(db, id): Promise<void>
export async function getWalletTransactionCount(db, walletId): Promise<number>
```

### 1.5 Wallet Management Screen (`app/settings/wallets.tsx`)

Replace placeholder with full UI:
- FlatList showing all wallets with icon, name, type, color
- FAB "+" button → opens add wallet Bottom Sheet
- Press wallet → edit form (Bottom Sheet)
- Long press → delete confirmation (blocked if wallet has transactions, except default)
- Default wallet "เงินสด" shows badge "ค่าเริ่มต้น" and cannot be deleted

### 1.6 WalletSelector Component (`components/common/WalletSelector.tsx`)

Horizontal scroll row for selecting wallet in TransactionForm:
- Shows wallet icon + name + color
- Selected state highlighted with primary border
- Same visual pattern as CategoryPicker

---

## 2. Transaction Upgrades

### 2.1 Transaction Interface Update

Add `walletId` as required field and `wallet` as optional join:

```typescript
interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId: string;         // NEW - required
  category?: Category;
  wallet?: Wallet;          // NEW - optional join
  note?: string;
  date: string;
  createdAt: string;
}
```

### 2.2 DB Query Updates

Both `getTransactionsByMonth` and `getAllTransactions` must:
- JOIN wallets table: `LEFT JOIN wallets w ON t.wallet_id = w.id`
- Map wallet fields in result: `wallet: { id, name, type, icon, color, ... }`

`insertTransaction` must accept and save `walletId`.
`updateTransaction` must accept and save `walletId`.

### 2.3 Edit Transaction

No new route needed — reuse existing Bottom Sheet in TransactionForm:

- `TransactionForm` gains optional `editTransaction?: Transaction` prop
- When `editTransaction` is set: pre-fill all fields, change button to "อัพเดท", call `updateTransaction()`
- When cleared: reset to add mode
- `app/(tabs)/index.tsx`: `onItemPress` → set editTransaction state → open bottom sheet

### 2.4 Calculator Keypad (`components/common/CalculatorPad.tsx`)

Replaces `AmountInput` TextInput with a calculator grid:

```
Display: ฿1,234.56
┌──────┬──────┬──────┬──────┐
│  7   │  8   │  9   │  ÷  │
│  4   │  5   │  6   │  ×  │
│  1   │  2   │  3   │  -  │
│  .   │  0   │  ⌫   │  +  │
├──────┴──────┴──────┴──────┤
│             =             │
└───────────────────────────┘
```

Props:
```typescript
interface CalculatorPadProps {
  value: number;
  onChange: (value: number) => void;
  type: TransactionType;  // for color theming
}
```

Features:
- Basic arithmetic: +, -, x, ÷
- Press `=` to evaluate expression
- Backspace (⌫) deletes last character
- Max 2 decimal places
- Display formatted as Thai Baht
- Haptic feedback on each button press
- Expression shown while typing (e.g., "350+65")

### 2.5 SectionList — Day Grouping

Replace FlashList in `TransactionList.tsx` with SectionList:

Group transactions by date. Each section:
- Header: `DayGroupHeader` showing date + daily income/expense totals
- Items: `TransactionItem` (unchanged)

New component: `components/transaction/DayGroupHeader.tsx`

```typescript
interface DayGroupHeaderProps {
  date: string;
  income: number;
  expense: number;
}
```

Display format: `วันนี้ (11 เม.ย.)  รายรับ ฿25,000  รายจ่าย ฿565`

Grouping logic: `useMemo` in TransactionList that converts flat array to sections.

---

## 3. Analysis Store + Frequent Transactions

### 3.1 Analysis Store (`lib/stores/analysis-store.ts`)

```typescript
interface AnalysisStore {
  analyses: Analysis[];
  isLoading: boolean;

  loadAnalysis: () => Promise<void>;
  trackTransaction: (tx: { walletId: string; categoryId: string; type: TransactionType; amount: number; note?: string }) => Promise<void>;
  getFrequentTransactions: (limit?: number) => Analysis[];
}
```

**Tracking logic in `trackTransaction()`:**
1. Query analysis table for matching record:
   - Full match: `wallet_id + category_id + type + amount + note` all equal
   - Basic match: `wallet_id + category_id + type + amount` equal (note ignored)
2. If full match found: `count++`, update `last_transaction_id`, `updated_at`
3. Else if basic match found: `count++`, update `last_transaction_id`, `updated_at`
4. Else: INSERT new analysis record with `count = 1`, `match_type = 'basic'`

**`getFrequentTransactions(limit = 6)`:**
- Return analyses sorted by `count DESC`, limited to `limit`
- Filter only where `count >= 2` (used at least twice)

### 3.2 Analysis DB Queries (`lib/stores/db.ts`)

Replace stub functions:

```typescript
export async function findAnalysisMatch(db, data: { walletId, categoryId, type, amount, note? }): Promise<Analysis | null>
export async function upsertAnalysis(db, data, matchType): Promise<void>
export async function getTopAnalyses(db, limit): Promise<Analysis[]>
export async function deleteAnalysisByWalletId(db, walletId): Promise<void>
```

### 3.3 FrequentTransactions Component (`components/transaction/FrequentTransactions.tsx`)

Horizontal scroll showing top frequent transactions on HomeScreen:

```typescript
interface FrequentTransactionsProps {
  analyses: Analysis[];
  categories: Category[];
  onSelect: (analysis: Analysis) => void;
}
```

- Each item: category icon + name + amount in a small card
- Horizontal ScrollView, max 6 items
- `onSelect` → opens TransactionForm in pre-fill mode (type, amount, categoryId, walletId, note from analysis)

### 3.4 Integration

```
addTransaction() in transaction-store.ts:
  1. insertTransaction(db, data)       // save to DB
  2. trackTransaction(data)            // update analysis
  3. loadTransactions()                // refresh list

FrequentTransactions tap:
  1. Set pre-fill data on TransactionForm
  2. Open bottom sheet
  3. User confirms/modifies → addTransaction() as normal
```

### 3.5 App Boot

In `app/_layout.tsx`, add to the `isReady` effect:
- `loadWallets()`
- `loadAnalysis()`

---

## 4. Files Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `lib/stores/wallet-store.ts` | Wallet CRUD store |
| Create | `lib/stores/analysis-store.ts` | Duplicate detection + frequent |
| Create | `components/common/WalletSelector.tsx` | Wallet picker for forms |
| Create | `components/common/CalculatorPad.tsx` | Calculator keypad |
| Create | `components/transaction/FrequentTransactions.tsx` | Frequent items row |
| Create | `components/transaction/DayGroupHeader.tsx` | Section header for day groups |
| Modify | `lib/stores/db.ts` | Migration, wallet queries, analysis queries, transaction JOIN wallet |
| Modify | `lib/stores/transaction-store.ts` | walletId param, analysis tracking |
| Modify | `types/index.ts` | walletId + wallet in Transaction |
| Modify | `components/transaction/TransactionForm.tsx` | Edit mode, WalletSelector, CalculatorPad |
| Modify | `components/transaction/TransactionList.tsx` | FlashList → SectionList |
| Modify | `components/transaction/TransactionItem.tsx` | Show wallet info |
| Modify | `app/(tabs)/index.tsx` | FrequentTransactions, edit handler |
| Modify | `app/settings/wallets.tsx` | Full wallet management UI |
| Modify | `app/_layout.tsx` | Load wallets + analysis on boot |

---

## 5. What This Does NOT Include

- Categories management screen (Phase 4)
- Budget alerts (Phase 4)
- Export/Import improvements (Phase 4)
- AI Analysis (Phase 3)
- Theme system changes (Phase 4)
