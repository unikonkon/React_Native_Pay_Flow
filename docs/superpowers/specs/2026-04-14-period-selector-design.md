# Period Selector Design

Date: 2026-04-14

## Goal

Replace the "เดือนย้อนหน้า/ถัดไป" selector on `app/(tabs)/index.tsx` and `app/(tabs)/analytics.tsx` with a shared `PeriodSelector` that supports four period types (1 week / 1 month / 6 months / 1 year), lets the user jump to any recent month via a centered modal, and flows through the data layer so all derived summaries, charts, and lists respect the chosen period.

## User Flow

1. Header shows the current period label + chevron prev/next.
2. Tapping the label opens a centered modal.
3. Modal has two rows:
   - **Period type tabs**: `1 สัปดาห์ | 1 เดือน | 6 เดือน | 1 ปี`
   - **Anchor picker** (conditional on period type):
     - `month` → 4×3 grid of last 12 months (newest first, highlights "เดือนล่าสุด"); tap = pick that month's anchor.
     - `week` → list of last 8 weeks (`3 - 9 มี.ค. 2569`)
     - `6months` / `year` → prev/next anchor arrows only (single row showing current range)
4. Confirm closes the modal; chevron prev/next shifts the anchor by period unit.

## Data Model

### `types/index.ts`
```ts
export type PeriodType = 'week' | 'month' | '6months' | 'year';
export interface Period {
  type: PeriodType;
  anchor: string; // YYYY-MM-DD — interpreted as start of the unit
}
```

### `lib/utils/period.ts` (new)
```ts
getCurrentPeriod(type: PeriodType): Period
getPeriodRange(p: Period): { start: string; end: string } // YYYY-MM-DD inclusive
shiftPeriod(p: Period, dir: -1 | 1): Period
formatPeriodLabel(p: Period): string
listRecentAnchors(type: PeriodType, count: number): Period[]
```

Rules:
- `week`: anchor = Monday of that week; range = Mon..Sun.
- `month`: anchor = 1st of month; range = 1st..last day.
- `6months`: anchor = 1st of the starting month; range covers 6 months.
- `year`: anchor = Jan 1; range = Jan 1..Dec 31.

### `lib/stores/transaction-store.ts`
- Replace `currentMonth: string` with `currentPeriod: Period`.
- `setCurrentPeriod(period)` replaces `setCurrentMonth`.
- `loadTransactions(period?)` calls the new range query.

### `lib/stores/db.ts`
- Add `getTransactionsByRange(db, start, end, walletId?)` (reuse the join shape from `getTransactionsByMonth`, filter with `t.date BETWEEN ? AND ?`).
- Keep `getTransactionsByMonth` for backward compatibility of other callers (e.g. export flow) or migrate them.
- Add `getSummariesByBuckets(db, buckets: {start, end, label}[], walletId?)` for the analytics bar chart so it can show buckets sized to the active period (weeks for `week`, months for `month`/`6months`, months for `year`).

### `lib/utils/format.ts`
- Add `formatDateRangeThai(start, end)` for week labels.
- Reuse `formatMonthYearThai` for month labels.

## Components

### `components/ui/PeriodSelector.tsx` (new)
Props:
```ts
interface PeriodSelectorProps {
  period: Period;
  onChange: (p: Period) => void;
  className?: string;
}
```
Renders the header row (prev chevron, label pressable, next chevron). Owns the modal internally using RN `Modal` with `transparent`, `animationType="fade"`, centered content (`bg-black/40` backdrop, `bg-card rounded-2xl p-4 mx-8`).

### `components/ui/PeriodPickerModal.tsx` (new, or co-located file)
Contains the tabs and anchor picker described in User Flow.

## Consumers

### `app/(tabs)/index.tsx`
- Replace the header `<View>` with `<PeriodSelector period={currentPeriod} onChange={setCurrentPeriod} />`.
- `useEffect` depends on `currentPeriod` and calls `loadTransactions(currentPeriod)`.
- `FrequentTransactions`: `analyses` are global (not period-scoped) and remain unchanged. Confirmed by user that period affects the transaction list + summary only.
- `useSummary(transactions)` already derives from `transactions` — no change needed; it automatically reflects the filtered period.

### `app/(tabs)/analytics.tsx`
- Replace the header `<View>` with `<PeriodSelector />`.
- `useEffect` on `currentPeriod` drives both the transaction load and the bar-chart bucket fetch.
- Bar chart buckets:
  - `week` → 7 daily buckets (Mon..Sun)
  - `month` → ~4 weekly buckets of that month
  - `6months` → 6 monthly buckets
  - `year` → 12 monthly buckets
- Update `getSummariesByBuckets` to power this.

## Out-of-scope

- No persistence of the selected period across app restarts (session-local, matches current behavior).
- AI history, export flow, and other `loadTransactions` callers (`more.tsx`, `settings/export.tsx`) pass no argument → they'll reload with the current period, which preserves today's behavior once `currentPeriod` defaults to current month.

## Risk Notes

- `strftime('%Y-%m', t.date)` based queries assume `t.date` is `YYYY-MM-DD`. The new range filter must assume the same. Confirmed by existing `insertTransaction` usage.
- The `FrequentTransactions` analyses table is independent of period — no change.
