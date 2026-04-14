# Period Selector Implementation Plan

**Goal:** Replace monthly navigation with a shared `PeriodSelector` (week/month/6months/year + month jump via modal) and thread the new `Period` type through the store, db layer, and both tab screens.

**Architecture:** New `Period` type and `period.ts` utils define ranges. New `getTransactionsByRange` + `getSummariesByBuckets` db functions replace the month-only queries. `transaction-store` swaps `currentMonth` for `currentPeriod`. A shared `PeriodSelector` component renders the header + modal picker; `index.tsx` and `analytics.tsx` both consume it.

**Tech Stack:** Expo SDK 54, React 19, NativeWind 4, Zustand 5, expo-sqlite.

---

### Task 1: Period types + utils

**Files:**
- Modify: `types/index.ts` (add `PeriodType`, `Period`)
- Create: `lib/utils/period.ts`
- Modify: `lib/utils/format.ts` (add `formatDateRangeThai`)

- [ ] **Step 1:** Add to `types/index.ts` (append near other type exports):

```ts
export type PeriodType = 'week' | 'month' | '6months' | 'year';
export interface Period {
  type: PeriodType;
  anchor: string; // YYYY-MM-DD — start of the unit
}
```

- [ ] **Step 2:** Append to `lib/utils/format.ts`:

```ts
export function formatDateRangeThai(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sDay = s.getDate();
  const eDay = e.getDate();
  const eMonth = THAI_MONTHS[e.getMonth()];
  const eYear = e.getFullYear() + 543;
  if (sameMonth) return `${sDay} - ${eDay} ${eMonth} ${eYear}`;
  const sMonth = THAI_MONTHS[s.getMonth()];
  return `${sDay} ${sMonth} - ${eDay} ${eMonth} ${eYear}`;
}
```

- [ ] **Step 3:** Create `lib/utils/period.ts`:

```ts
import type { Period, PeriodType } from '@/types';
import { THAI_MONTHS_FULL, THAI_MONTHS, formatMonthYearThai, formatDateRangeThai } from './format';

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getCurrentPeriod(type: PeriodType): Period {
  const now = new Date();
  switch (type) {
    case 'week': return { type, anchor: toISO(mondayOf(now)) };
    case 'month': return { type, anchor: toISO(firstOfMonth(now)) };
    case '6months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { type, anchor: toISO(start) };
    }
    case 'year': return { type, anchor: `${now.getFullYear()}-01-01` };
  }
}

export function getPeriodRange(p: Period): { start: string; end: string } {
  const a = new Date(p.anchor);
  switch (p.type) {
    case 'week': {
      const end = new Date(a);
      end.setDate(a.getDate() + 6);
      return { start: toISO(a), end: toISO(end) };
    }
    case 'month': {
      const end = new Date(a.getFullYear(), a.getMonth() + 1, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case '6months': {
      const end = new Date(a.getFullYear(), a.getMonth() + 6, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case 'year': {
      return { start: `${a.getFullYear()}-01-01`, end: `${a.getFullYear()}-12-31` };
    }
  }
}

export function shiftPeriod(p: Period, dir: -1 | 1): Period {
  const a = new Date(p.anchor);
  switch (p.type) {
    case 'week': {
      a.setDate(a.getDate() + 7 * dir);
      return { type: 'week', anchor: toISO(a) };
    }
    case 'month': {
      const n = new Date(a.getFullYear(), a.getMonth() + dir, 1);
      return { type: 'month', anchor: toISO(n) };
    }
    case '6months': {
      const n = new Date(a.getFullYear(), a.getMonth() + 6 * dir, 1);
      return { type: '6months', anchor: toISO(n) };
    }
    case 'year': {
      return { type: 'year', anchor: `${a.getFullYear() + dir}-01-01` };
    }
  }
}

export function formatPeriodLabel(p: Period): string {
  const { start, end } = getPeriodRange(p);
  switch (p.type) {
    case 'week': return formatDateRangeThai(start, end);
    case 'month': {
      const a = new Date(p.anchor);
      return `${THAI_MONTHS_FULL[a.getMonth()]} ${a.getFullYear() + 543}`;
    }
    case '6months': {
      const s = new Date(start);
      const e = new Date(end);
      return `${THAI_MONTHS[s.getMonth()]} ${s.getFullYear() + 543} - ${THAI_MONTHS[e.getMonth()]} ${e.getFullYear() + 543}`;
    }
    case 'year': {
      return `ปี ${new Date(p.anchor).getFullYear() + 543}`;
    }
  }
}

export function listRecentAnchors(type: PeriodType, count: number): Period[] {
  const out: Period[] = [];
  let cur = getCurrentPeriod(type);
  for (let i = 0; i < count; i++) {
    out.push(cur);
    cur = shiftPeriod(cur, -1);
  }
  return out;
}

export function periodsEqual(a: Period, b: Period): boolean {
  return a.type === b.type && a.anchor === b.anchor;
}

export function getBarChartBuckets(p: Period): { start: string; end: string; label: string }[] {
  const buckets: { start: string; end: string; label: string }[] = [];
  const a = new Date(p.anchor);
  switch (p.type) {
    case 'week': {
      for (let i = 0; i < 7; i++) {
        const d = new Date(a);
        d.setDate(a.getDate() + i);
        const iso = toISO(d);
        buckets.push({ start: iso, end: iso, label: String(d.getDate()) });
      }
      return buckets;
    }
    case 'month': {
      const last = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
      let day = 1;
      let idx = 1;
      while (day <= last) {
        const endDay = Math.min(day + 6, last);
        buckets.push({
          start: `${a.getFullYear()}-${pad(a.getMonth() + 1)}-${pad(day)}`,
          end: `${a.getFullYear()}-${pad(a.getMonth() + 1)}-${pad(endDay)}`,
          label: `W${idx}`,
        });
        day = endDay + 1;
        idx++;
      }
      return buckets;
    }
    case '6months': {
      for (let i = 0; i < 6; i++) {
        const s = new Date(a.getFullYear(), a.getMonth() + i, 1);
        const e = new Date(a.getFullYear(), a.getMonth() + i + 1, 0);
        buckets.push({ start: toISO(s), end: toISO(e), label: THAI_MONTHS[s.getMonth()] });
      }
      return buckets;
    }
    case 'year': {
      for (let i = 0; i < 12; i++) {
        const s = new Date(a.getFullYear(), i, 1);
        const e = new Date(a.getFullYear(), i + 1, 0);
        buckets.push({ start: toISO(s), end: toISO(e), label: THAI_MONTHS[i] });
      }
      return buckets;
    }
  }
}
```

---

### Task 2: DB range + bucket queries

**Files:**
- Modify: `lib/stores/db.ts`

- [ ] **Step 1:** After `getTransactionsByMonth`, add `getTransactionsByRange` (same JOIN/mapping, range filter):

```ts
export async function getTransactionsByRange(
  db: SQLiteDatabase,
  start: string,
  end: string,
): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; note: string | null;
    date: string; created_at: string; wallet_id: string | null;
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
     WHERE t.date BETWEEN ? AND ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [start, end]
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: r.created_at,
    walletId: r.wallet_id ?? 'wallet-cash',
    category: {
      id: r.category_id,
      name: r.cat_name,
      icon: r.cat_icon,
      color: r.cat_color,
      type: r.cat_type as TransactionType,
      isCustom: r.cat_is_custom === 1,
      sortOrder: r.cat_sort_order,
    },
    wallet: r.w_name ? { id: r.wallet_id!, name: r.w_name, type: r.w_type as WalletType, icon: r.w_icon!, color: r.w_color!, currency: 'THB', initialBalance: 0, currentBalance: 0, isAsset: true, createdAt: '' } : undefined,
  }));
}
```

- [ ] **Step 2:** After `getMonthlySummaries`, add bucket summary:

```ts
export async function getSummariesByBuckets(
  db: SQLiteDatabase,
  buckets: { start: string; end: string; label: string }[],
  walletId?: string,
): Promise<{ label: string; income: number; expense: number }[]> {
  const results: { label: string; income: number; expense: number }[] = [];
  for (const b of buckets) {
    const params: (string | number)[] = [b.start, b.end];
    let walletFilter = '';
    if (walletId) {
      walletFilter = ' AND wallet_id = ?';
      params.push(walletId);
    }
    const rows = await db.getAllAsync<{ type: string; total: number }>(
      `SELECT type, SUM(amount) as total FROM transactions
       WHERE date BETWEEN ? AND ?${walletFilter}
       GROUP BY type`,
      params
    );
    const income = rows.find(r => r.type === 'income')?.total ?? 0;
    const expense = rows.find(r => r.type === 'expense')?.total ?? 0;
    results.push({ label: b.label, income, expense });
  }
  return results;
}
```

---

### Task 3: Update transaction-store

**Files:**
- Modify: `lib/stores/transaction-store.ts`

- [ ] **Step 1:** Replace imports/interface/state:

```ts
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
  editingTransaction: Transaction | null;

  setCurrentPeriod: (period: Period) => void;
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
  editingTransaction: null,

  setCurrentPeriod: (period) => set({ currentPeriod: period }),
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
```

---

### Task 4: PeriodSelector component

**Files:**
- Create: `components/ui/PeriodSelector.tsx`

- [ ] **Step 1:** Full file:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { Period, PeriodType } from '@/types';
import {
  formatPeriodLabel,
  getCurrentPeriod,
  listRecentAnchors,
  periodsEqual,
  shiftPeriod,
} from '@/lib/utils/period';

interface Props {
  period: Period;
  onChange: (p: Period) => void;
  className?: string;
}

const TYPE_LABEL: Record<PeriodType, string> = {
  week: '1 สัปดาห์',
  month: '1 เดือน',
  '6months': '6 เดือน',
  year: '1 ปี',
};

export function PeriodSelector({ period, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<PeriodType>(period.type);

  const handleOpen = () => {
    setDraftType(period.type);
    setOpen(true);
  };

  const handlePickType = (t: PeriodType) => {
    setDraftType(t);
    if (t !== 'month' && t !== 'week') {
      onChange(getCurrentPeriod(t));
      setOpen(false);
    }
  };

  const handlePickAnchor = (p: Period) => {
    onChange(p);
    setOpen(false);
  };

  const anchors = listRecentAnchors(draftType, draftType === 'month' ? 12 : 8);

  return (
    <View className={className}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => onChange(shiftPeriod(period, -1))} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#666" />
        </Pressable>
        <Pressable onPress={handleOpen} className="flex-row items-center px-3 py-1.5 rounded-lg bg-secondary/60">
          <Text className="text-foreground font-bold text-lg">{formatPeriodLabel(period)}</Text>
          <Ionicons name="chevron-down" size={18} color="#666" style={{ marginLeft: 4 }} />
        </Pressable>
        <Pressable onPress={() => onChange(shiftPeriod(period, 1))} className="p-2">
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} className="flex-1 bg-black/40 items-center justify-center">
          <Pressable onPress={e => e.stopPropagation()} className="w-11/12 max-w-md bg-card rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-lg">เลือกช่วงเวลา</Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#666" />
              </Pressable>
            </View>

            <View className="flex-row bg-secondary rounded-xl p-1 mb-4">
              {(Object.keys(TYPE_LABEL) as PeriodType[]).map(t => (
                <Pressable
                  key={t}
                  onPress={() => handlePickType(t)}
                  className={`flex-1 py-2 rounded-lg items-center ${draftType === t ? 'bg-primary' : ''}`}
                >
                  <Text className={`text-xs font-semibold ${draftType === t ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {TYPE_LABEL[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {draftType === 'month' && (
              <ScrollView className="max-h-80">
                <View className="flex-row flex-wrap -mx-1">
                  {anchors.map((p, i) => {
                    const selected = periodsEqual(p, period);
                    const isLatest = i === 0;
                    return (
                      <View key={p.anchor} className="w-1/3 p-1">
                        <Pressable
                          onPress={() => handlePickAnchor(p)}
                          className={`px-2 py-3 rounded-xl border items-center ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
                        >
                          <Text className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`} numberOfLines={1}>
                            {formatPeriodLabel(p)}
                          </Text>
                          {isLatest && (
                            <Text className={`text-[10px] mt-0.5 ${selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              เดือนล่าสุด
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {draftType === 'week' && (
              <ScrollView className="max-h-80">
                {anchors.map((p, i) => {
                  const selected = periodsEqual(p, period);
                  return (
                    <Pressable
                      key={p.anchor}
                      onPress={() => handlePickAnchor(p)}
                      className={`px-3 py-3 rounded-xl mb-2 border ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
                    >
                      <Text className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {formatPeriodLabel(p)}
                        {i === 0 ? '  (สัปดาห์นี้)' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
```

---

### Task 5: Wire `index.tsx`

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1:** Replace `formatMonthYearThai, shiftMonth` import with `PeriodSelector`:

```tsx
import { formatCurrency } from '@/lib/utils/format';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
```

(remove old `Ionicons`-only uses tied to the prev/next chevrons; keep existing imports otherwise)

- [ ] **Step 2:** Replace destructure from store:

```tsx
const {
  transactions,
  currentPeriod,
  setCurrentPeriod,
  loadTransactions,
  deleteTransaction,
  setEditingTransaction,
} = useTransactionStore();
```

- [ ] **Step 3:** Replace effect and drop `handlePrevMonth/handleNextMonth`:

```tsx
useEffect(() => {
  loadTransactions(currentPeriod);
}, [currentPeriod, loadTransactions]);
```

- [ ] **Step 4:** Replace header `<View className="flex-row items-center justify-between mb-2">...</View>` with:

```tsx
<PeriodSelector
  period={currentPeriod}
  onChange={setCurrentPeriod}
  className="mb-2"
/>
```

---

### Task 6: Wire `analytics.tsx`

**Files:**
- Modify: `app/(tabs)/analytics.tsx`

- [ ] **Step 1:** Update imports:

```tsx
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { getAllTransactions, getDb, getSummariesByBuckets } from '@/lib/stores/db';
import { getBarChartBuckets } from '@/lib/utils/period';
```

(remove `formatMonthYearThai, shiftMonth` import; remove `getMonthlySummaries`)

- [ ] **Step 2:** Replace store destructure + effects:

```tsx
const { transactions, currentPeriod, setCurrentPeriod, loadTransactions } = useTransactionStore();
// ...
useEffect(() => {
  loadTransactions(currentPeriod);
}, [currentPeriod, loadTransactions]);
```

- [ ] **Step 3:** Replace bar-chart effect:

```tsx
useEffect(() => {
  const fetchBarData = async () => {
    const buckets = getBarChartBuckets(currentPeriod);
    const labels = buckets.map(b => b.label);
    try {
      const db = getDb();
      const rows = await getSummariesByBuckets(db, buckets, selectedWalletId ?? undefined);
      setBarData({
        labels,
        incomeData: rows.map(r => r.income),
        expenseData: rows.map(r => r.expense),
      });
    } catch {
      setBarData({ labels, incomeData: labels.map(() => 0), expenseData: labels.map(() => 0) });
    }
  };
  fetchBarData();
}, [currentPeriod, selectedWalletId]);
```

- [ ] **Step 4:** Remove `handlePrevMonth`/`handleNextMonth`; replace header `<View className="flex-row items-center justify-between px-4 pt-2 pb-1">...</View>` with:

```tsx
<PeriodSelector
  period={currentPeriod}
  onChange={setCurrentPeriod}
  className="px-4 pt-2 pb-1"
/>
```

---

### Task 7: Verify + run

- [ ] **Step 1:** Run `npx tsc --noEmit` → 0 errors.
- [ ] **Step 2:** Start `npx expo start` and manually verify:
  - Tap month label on both tabs → modal opens centered
  - Switch to each period type → header label updates
  - Prev/Next chevrons shift correctly per type
  - 1 เดือน grid shows 12 entries, "เดือนล่าสุด" badge on the first, tapping jumps to that month
  - Bar chart buckets match period (7 daily / ~5 weekly / 6 monthly / 12 monthly)
