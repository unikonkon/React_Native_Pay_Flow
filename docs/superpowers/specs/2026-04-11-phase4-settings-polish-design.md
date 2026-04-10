# Phase 4: Settings & Polish — Design Spec

**Date:** 2026-04-11
**Scope:** Categories management, Budget alerts, Theme system (9 themes), Export (Excel+Text), Import (Excel+Text)
**Prerequisite:** Phase 3 complete

---

## 1. Categories Management (`app/settings/categories.tsx`)

Replace placeholder with full UI:

- FlatList with 2 sections: expense categories / income categories
- Each item shows: colored icon circle + name + "custom" badge if user-created
- Press item → edit Bottom Sheet (name, icon, color) — only for custom categories
- Long press → delete confirmation (only custom categories, default categories cannot be deleted)
- FAB "+" → add new category Bottom Sheet (name, type expense/income, icon, color)
- Uses existing `useCategoryStore` (addCategory, deleteCategory already implemented)

Need to add `updateCategory` to category-store and db.ts (currently missing).

New DB query:
```typescript
export async function updateCategory(db, id, updates: Partial<{ name, icon, color }>): Promise<void>
```

---

## 2. Budget Alerts

### 2.1 Alert Settings Store (`lib/stores/alert-settings-store.ts`)

```typescript
interface AlertSettingsStore {
  monthlyExpenseTarget: number;
  isMonthlyTargetEnabled: boolean;
  categoryLimits: CategoryLimit[];
  isCategoryLimitsEnabled: boolean;

  loadAlertSettings: () => Promise<void>;
  updateAlertSettings: (partial: Partial<AlertSettings>) => Promise<void>;
  addCategoryLimit: (categoryId: string, limit: number) => Promise<void>;
  removeCategoryLimit: (categoryId: string) => Promise<void>;
}
```

Stored in AsyncStorage with key `'alert_settings'`.

### 2.2 Alerts Settings Screen (`app/settings/alerts.tsx`)

Replace placeholder:
- Section 1: Monthly target
  - Toggle on/off
  - Number input for target amount (Thai Baht)
- Section 2: Category limits
  - Toggle on/off
  - List of categories with their limits
  - "+" button to add category limit (picker + amount input)
  - Swipe/long-press to remove

### 2.3 Alert Banner (`components/ui/AlertBanner.tsx`)

Props:
```typescript
interface AlertBannerProps {
  currentExpense: number;
  target: number;
}
```

Display logic:
- Hidden if target = 0 or not enabled
- Yellow warning at >= 80%: "ใช้จ่ายแล้ว ฿XX,XXX จากเป้า ฿XX,XXX (XX%)"
- Red danger at >= 100%: "เกินเป้า! ฿XX,XXX จากเป้า ฿XX,XXX (XX%)"

Integrated into `app/(tabs)/index.tsx` between the summary header and frequent transactions.

---

## 3. Theme System

### 3.1 Theme Store (`lib/stores/theme-store.ts`)

```typescript
interface ThemeStore {
  currentTheme: string;
  loadTheme: () => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
}
```

Stored in AsyncStorage with key `'app_theme'`. Default: `'light'`.

Available themes (from global.css): light, dark, zinc, stone, cyan, sky, teal, gray, neutral.

Apply by adding/removing CSS class on the root view. NativeWind supports `className` based theming via CSS variables defined in `global.css`.

### 3.2 Theme Picker Screen (`app/settings/theme.tsx`)

Replace placeholder:
- 3x3 grid of theme cards
- Each card shows: theme name (Thai) + preview color swatch (primary + background + card colors)
- Selected theme has checkmark + border highlight
- Press to apply immediately

Theme names (Thai):
| Key | Name |
|-----|------|
| light | สว่าง |
| dark | มืด |
| zinc | ซิงค์ |
| stone | สโตน |
| cyan | ฟ้า |
| sky | ท้องฟ้า |
| teal | เขียวน้ำทะเล |
| gray | เทา |
| neutral | ธรรมชาติ |

---

## 4. Export/Import

### 4.1 Export Additions (`lib/utils/export.ts`)

Add two new functions alongside existing `exportToCSV`:

**`exportToExcel(transactions)`:**
- Uses `xlsx` library (already in architecture dependencies)
- Creates workbook with columns: วันที่, ประเภท, หมวดหมู่, กระเป๋าเงิน, จำนวนเงิน, หมายเหตุ
- Saves to temp file → share via expo-sharing
- File name: `expense_TIMESTAMP.xlsx`

**`exportToText(transactions)`:**
- Plain text format grouped by date
- Format per day:
  ```
  === 11 เม.ย. 2569 ===
  [รายจ่าย] อาหาร: ฿350 (เงินสด) - ข้าวมันไก่
  [รายรับ] เงินเดือน: ฿25,000 (ธนาคาร)
  ```
- Share via expo-sharing

### 4.2 Import (`lib/utils/import.ts`)

New file:

**`importFromExcel(uri)`:**
- Read file from URI using expo-file-system
- Parse with `xlsx` library
- Expect columns: วันที่, ประเภท, หมวดหมู่, จำนวนเงิน, หมายเหตุ (กระเป๋าเงิน optional)
- Match category by name → categoryId, match wallet by name → walletId (default to 'wallet-cash')
- Insert each valid row as transaction
- Return: `{ imported: number; skipped: number; errors: string[] }`

**`importFromText(uri)`:**
- Read text file
- Parse each line matching pattern: `[ประเภท] หมวด: ฿amount (กระเป๋า) - note`
- Same matching logic as Excel import
- Return same result format

Dependency needed: `expo-document-picker` for file selection.

### 4.3 Export/Import Screen (`app/settings/export.tsx`)

Replace placeholder:
- Section "ส่งออก":
  - Button "ส่งออก CSV" (existing)
  - Button "ส่งออก Excel"
  - Button "ส่งออก Text"
- Section "นำเข้า":
  - Button "นำเข้าจากไฟล์ Excel"
  - Button "นำเข้าจากไฟล์ Text"
  - Shows result after import (imported/skipped counts)

---

## 5. Files Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `lib/stores/alert-settings-store.ts` | Budget alert settings (AsyncStorage) |
| Create | `lib/stores/theme-store.ts` | Theme management (AsyncStorage) |
| Create | `lib/utils/import.ts` | Import from Excel/Text files |
| Create | `components/ui/AlertBanner.tsx` | Budget warning banner |
| Modify | `lib/stores/db.ts` | Add updateCategory query |
| Modify | `lib/stores/category-store.ts` | Add updateCategory action |
| Modify | `lib/utils/export.ts` | Add exportToExcel + exportToText |
| Modify | `app/settings/categories.tsx` | Full category management UI |
| Modify | `app/settings/alerts.tsx` | Budget alert settings UI |
| Modify | `app/settings/theme.tsx` | Theme picker grid UI |
| Modify | `app/settings/export.tsx` | Export/Import UI |
| Modify | `app/(tabs)/index.tsx` | AlertBanner integration |
| Modify | `app/_layout.tsx` | Load alert-settings + theme stores |

---

## 6. Dependencies

- `xlsx` — needs to be installed (for Excel export/import)
- `expo-document-picker` — needs to be installed (for file import)

---

## 7. What This Does NOT Include

- App icon + splash screen (asset design, not code — Phase 5)
- Push notifications (Phase 5)
- Widget (Phase 5)
- Biometric lock (Phase 5)
