# CeasFlow Restructure to Match MOBILE-APP-ARCHITECTURE

**Date:** 2026-04-11
**Approach:** Option A — Move all files + update imports in one pass
**Scope:** Restructure only (no new feature logic). Placeholders for future phases.

---

## 1. Directory Structure Migration

### Files to move

| Source | Destination | Notes |
|--------|------------|-------|
| `db/schema.ts` | `lib/stores/db.ts` | Merge into single file |
| `db/migrations.ts` | `lib/stores/db.ts` | Merge |
| `db/queries/transactions.ts` | `lib/stores/db.ts` | Merge |
| `db/queries/categories.ts` | `lib/stores/db.ts` | Merge |
| `hooks/useDatabase.ts` | `lib/stores/db.ts` | Merge (singleton pattern) |
| `stores/transactionStore.ts` | `lib/stores/transaction-store.ts` | Rename to kebab-case |
| `stores/categoryStore.ts` | `lib/stores/category-store.ts` | Rename to kebab-case |
| `stores/settingsStore.ts` | `lib/stores/settings-store.ts` | Rename to kebab-case |
| `utils/currency.ts` | `lib/utils/format.ts` | Merge with date.ts |
| `utils/date.ts` | `lib/utils/format.ts` | Merge with currency.ts |
| `utils/export.ts` | `lib/utils/export.ts` | Move |
| `utils/id.ts` | `lib/utils/id.ts` | Move |
| `constants/categories.ts` | `lib/constants/categories.ts` | Move |
| `components/summary/*` | `components/analytics/*` | Rename folder |
| `components/haptic-tab.tsx` | `components/layout/HapticTab.tsx` | Move + rename |

### Folders to delete (after move)

- `db/` (entire folder)
- `stores/` (entire folder)
- `utils/` (entire folder)
- `constants/` (entire folder, including unused theme.ts)
- `components/summary/` (renamed to analytics)
- `components/transactions/` (empty)
- `components/wallets/` (empty)

### New folders to create

- `lib/stores/`
- `lib/utils/`
- `lib/constants/`
- `lib/api/`
- `components/common/`
- `components/analytics/`
- `components/ai/`
- `components/settings/`
- `components/layout/`
- `app/settings/`
- `app/transaction/`

---

## 2. File Consolidation

### 2.1 `lib/stores/db.ts`

Merges 5 files into 1. Internal structure:

1. **Database Singleton** — `getDatabase()` returns cached instance
2. **Schema** — CREATE TABLE for 5 tables (transactions, categories, wallets, ai_history, analysis) with indexes. Uses V6 schema from architecture doc as baseline.
3. **Initialization** — `initializeDatabase()` creates tables, seeds 30 expense + 14 income default categories, seeds default wallets
4. **Transaction Queries** — `insertTransaction`, `updateTransaction`, `deleteTransaction`, `getTransactionsByMonth`
5. **Category Queries** — `getAllCategories`, `insertCategory`, `deleteCategory`
6. **Wallet Queries** — stub functions (implement Phase 2)
7. **AI History Queries** — stub functions (implement Phase 3)
8. **Analysis Queries** — stub functions (implement Phase 2)

New tables added to schema but query functions are stubs only.

### 2.2 `lib/utils/format.ts`

Merges `utils/currency.ts` + `utils/date.ts`. Exports:

- Currency: `formatCurrency`, `parseCurrencyInput`, `formatNumber`, `formatPercentage`
- Date: `formatDateThai`, `formatMonthYearThai`, `formatRelativeDate`, `formatTime`, `getDayOfWeek`, `isSameDay`, `shiftMonth`
- Constants: `THAI_MONTHS`, `THAI_MONTHS_SHORT`, `THAI_DAYS`

---

## 3. Types Additions (`types/index.ts`)

New interfaces to add (definitions only, no logic changes):

- `WalletType`, `Wallet`, `WalletBalance`
- `TransactionInput`, `TransactionWithCategory`, `DailySummary`
- `AiPromptType`, `AiHistory`, `StructuredResult`
- `AlertSettings`, `CategoryLimit`
- `MatchType`, `Analysis`
- `AppSettings` (extends existing Settings)

Existing `Transaction` interface gains optional fields: `walletId`, `currency`, `imageUrl`, `createdAt`, `updatedAt`. These are optional to maintain backward compatibility with current data.

---

## 4. Tab Navigation Changes

### `app/(tabs)/_layout.tsx`

Change from 3 tabs to 4 tabs:

| Tab | File | Label | Icon |
|-----|------|-------|------|
| Home | `index.tsx` | รายการ | list-outline |
| Analytics | `analytics.tsx` | สรุป | pie-chart-outline |
| AI Analysis | `ai-analysis.tsx` | AI วิเคราะห์ | sparkles-outline |
| More | `more.tsx` | ตั้งค่า | settings-outline |

- `summary.tsx` renamed to `analytics.tsx` (content unchanged)
- `settings.tsx` renamed to `more.tsx` (content unchanged)
- `ai-analysis.tsx` created as placeholder screen

### Settings sub-screens (all placeholders)

- `app/settings/wallets.tsx`
- `app/settings/categories.tsx`
- `app/settings/alerts.tsx`
- `app/settings/export.tsx`
- `app/settings/theme.tsx`

---

## 5. Import Path Updates

Every file that imports from moved modules must be updated. The `@/` alias points to project root, so:

- `@/stores/*` → `@/lib/stores/*`
- `@/db/*` → `@/lib/stores/db`
- `@/utils/*` → `@/lib/utils/*`
- `@/constants/*` → `@/lib/constants/*`
- `@/hooks/useDatabase` → `@/lib/stores/db`

Store hook names remain unchanged (`useTransactionStore`, `useCategoryStore`, `useSettingsStore`).

---

## 6. What This Does NOT Change

- No new feature logic (wallets, AI, alerts, etc.)
- No changes to existing UI components (only import paths)
- No changes to existing business logic in stores
- No package.json changes
- No tailwind/NativeWind config changes
- Existing data in SQLite is preserved (new tables are additive)

---

## 7. Verification

After restructure:
1. `npx expo start` — app boots without errors
2. All existing features work: add/edit/delete transactions, view summary, change settings
3. No broken imports (TypeScript compilation clean)
