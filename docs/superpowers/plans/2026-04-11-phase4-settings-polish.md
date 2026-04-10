# Phase 4: Settings & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all settings screens (categories, alerts, theme, export/import), add budget alert banner on home screen.

**Architecture:** Stores-first — create alert-settings and theme stores, add updateCategory DB query, then build UI screens. Export/Import use xlsx library + expo-document-picker.

**Tech Stack:** React Native + Expo, TypeScript, Zustand, AsyncStorage, xlsx, expo-document-picker, expo-sharing, NativeWind

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `lib/stores/alert-settings-store.ts` | Budget alert settings (AsyncStorage) |
| `lib/stores/theme-store.ts` | Theme management (AsyncStorage) |
| `lib/utils/import.ts` | Import transactions from Excel/Text files |
| `components/ui/AlertBanner.tsx` | Budget warning banner |

### Modified files
| File | Changes |
|------|---------|
| `lib/stores/db.ts` | Add updateCategory query |
| `lib/stores/category-store.ts` | Add updateCategory action |
| `lib/utils/export.ts` | Add exportToExcel + exportToText |
| `app/settings/categories.tsx` | Full category management UI |
| `app/settings/alerts.tsx` | Budget alert settings UI |
| `app/settings/theme.tsx` | Theme picker grid |
| `app/settings/export.tsx` | Export/Import UI |
| `app/(tabs)/index.tsx` | AlertBanner integration |
| `app/_layout.tsx` | Load alert-settings + theme stores |

---

### Task 1: Install dependencies (xlsx + expo-document-picker)

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd "/Users/macbook3lf1/web work/React_Native_Pay_Flow"
npx expo install xlsx expo-document-picker
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install xlsx and expo-document-picker"
```

---

### Task 2: Add updateCategory DB query + store action

**Files:**
- Modify: `lib/stores/db.ts`
- Modify: `lib/stores/category-store.ts`

- [ ] **Step 1: Add updateCategory to db.ts**

Add after the existing `deleteCategory` function in db.ts:

```typescript
export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<{ name: string; icon: string; color: string }>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (updates.name !== undefined) { sets.push('name = ?'); values.push(updates.name); }
  if (updates.icon !== undefined) { sets.push('icon = ?'); values.push(updates.icon); }
  if (updates.color !== undefined) { sets.push('color = ?'); values.push(updates.color); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ? AND is_custom = 1`, values);
}
```

- [ ] **Step 2: Add updateCategory to category-store.ts**

Update the import in category-store.ts:

```typescript
import { getDb, getAllCategories, insertCategory, deleteCategory as deleteCat, updateCategory as updateCat } from '@/lib/stores/db';
```

Add to the CategoryStore interface:

```typescript
updateCategory: (id: string, updates: Partial<{ name: string; icon: string; color: string }>) => Promise<void>;
```

Add the implementation in the store:

```typescript
  updateCategory: async (id, updates) => {
    const db = getDb();
    await updateCat(db, id, updates);
    await get().loadCategories();
  },
```

- [ ] **Step 3: Commit**

```bash
git add lib/stores/db.ts lib/stores/category-store.ts
git commit -m "feat: add updateCategory query and store action"
```

---

### Task 3: Create alert-settings-store

**Files:**
- Create: `lib/stores/alert-settings-store.ts`

- [ ] **Step 1: Create the store**

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AlertSettings, CategoryLimit } from '@/types';

const ALERT_SETTINGS_KEY = 'alert_settings';

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  monthlyExpenseTarget: 0,
  isMonthlyTargetEnabled: false,
  categoryLimits: [],
  isCategoryLimitsEnabled: false,
};

interface AlertSettingsStore extends AlertSettings {
  isLoaded: boolean;
  loadAlertSettings: () => Promise<void>;
  updateAlertSettings: (partial: Partial<AlertSettings>) => Promise<void>;
  addCategoryLimit: (categoryId: string, limit: number) => Promise<void>;
  removeCategoryLimit: (categoryId: string) => Promise<void>;
}

export const useAlertSettingsStore = create<AlertSettingsStore>((set, get) => ({
  ...DEFAULT_ALERT_SETTINGS,
  isLoaded: false,

  loadAlertSettings: async () => {
    const json = await AsyncStorage.getItem(ALERT_SETTINGS_KEY);
    if (json) {
      const saved = JSON.parse(json) as Partial<AlertSettings>;
      set({ ...DEFAULT_ALERT_SETTINGS, ...saved, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },

  updateAlertSettings: async (partial) => {
    const current: AlertSettings = {
      monthlyExpenseTarget: get().monthlyExpenseTarget,
      isMonthlyTargetEnabled: get().isMonthlyTargetEnabled,
      categoryLimits: get().categoryLimits,
      isCategoryLimitsEnabled: get().isCategoryLimitsEnabled,
    };
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(updated));
    set(updated);
  },

  addCategoryLimit: async (categoryId, limit) => {
    const limits = [...get().categoryLimits.filter(l => l.categoryId !== categoryId), { categoryId, limit }];
    await get().updateAlertSettings({ categoryLimits: limits });
  },

  removeCategoryLimit: async (categoryId) => {
    const limits = get().categoryLimits.filter(l => l.categoryId !== categoryId);
    await get().updateAlertSettings({ categoryLimits: limits });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/alert-settings-store.ts
git commit -m "feat: create alert-settings store with AsyncStorage persistence"
```

---

### Task 4: Create theme-store

**Files:**
- Create: `lib/stores/theme-store.ts`

- [ ] **Step 1: Create the store**

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

interface ThemeStore {
  currentTheme: string;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  currentTheme: 'light',
  isLoaded: false,

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    set({ currentTheme: saved ?? 'light', isLoaded: true });
  },

  setTheme: async (theme) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    set({ currentTheme: theme });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/theme-store.ts
git commit -m "feat: create theme store with AsyncStorage persistence"
```

---

### Task 5: Update app/_layout.tsx to load new stores

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add imports and load calls**

Add imports:
```typescript
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
```

In `RootLayout()`, add:
```typescript
const loadAlertSettings = useAlertSettingsStore(s => s.loadAlertSettings);
const loadTheme = useThemeStore(s => s.loadTheme);
const currentTheme = useThemeStore(s => s.currentTheme);
```

Add `loadAlertSettings()` and `loadTheme()` to the useEffect, add to dependency array.

Update the root `GestureHandlerRootView` to apply the theme class:
```tsx
<GestureHandlerRootView style={{ flex: 1 }} className={currentTheme !== 'light' ? currentTheme : undefined}>
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: load alert-settings and theme stores on boot, apply theme class"
```

---

### Task 6: Create AlertBanner component

**Files:**
- Create: `components/ui/AlertBanner.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';

interface AlertBannerProps {
  currentExpense: number;
  target: number;
}

export function AlertBanner({ currentExpense, target }: AlertBannerProps) {
  if (target <= 0) return null;

  const percentage = Math.round((currentExpense / target) * 100);

  if (percentage < 80) return null;

  const isDanger = percentage >= 100;

  return (
    <View className={`mx-4 mt-2 p-3 rounded-xl flex-row items-center ${isDanger ? 'bg-expense/15' : 'bg-[#F59E0B]/15'}`}>
      <Ionicons
        name={isDanger ? 'alert-circle' : 'warning'}
        size={20}
        color={isDanger ? '#EF4444' : '#F59E0B'}
      />
      <View className="flex-1 ml-2">
        <Text className={`font-semibold text-sm ${isDanger ? 'text-expense' : 'text-[#F59E0B]'}`}>
          {isDanger ? 'เกินเป้า!' : 'ใกล้ถึงเป้า'}
        </Text>
        <Text className="text-muted-foreground text-xs">
          ใช้จ่ายแล้ว {formatCurrency(currentExpense)} จากเป้า {formatCurrency(target)} ({percentage}%)
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/AlertBanner.tsx
git commit -m "feat: create AlertBanner component for budget warnings"
```

---

### Task 7: Integrate AlertBanner into HomeScreen

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add imports and banner**

Add imports:
```typescript
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
```

In `TransactionsScreen()`, add:
```typescript
const { isMonthlyTargetEnabled, monthlyExpenseTarget } = useAlertSettingsStore();
```

Add the AlertBanner in the JSX, between the summary header `</View>` and `<FrequentTransactions`:

```tsx
      {/* Budget Alert */}
      {isMonthlyTargetEnabled && (
        <AlertBanner currentExpense={totalExpense} target={monthlyExpenseTarget} />
      )}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: integrate AlertBanner into HomeScreen"
```

---

### Task 8: Add exportToExcel and exportToText

**Files:**
- Modify: `lib/utils/export.ts`

- [ ] **Step 1: Add new export functions**

Add after the existing `exportToCSV` function:

```typescript
export async function exportToExcel(transactions: Transaction[]) {
  const XLSX = require('xlsx');

  const data = transactions.map(t => ({
    'วันที่': t.date,
    'ประเภท': t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    'หมวดหมู่': t.category?.name ?? '',
    'กระเป๋าเงิน': t.wallet?.name ?? 'เงินสด',
    'จำนวนเงิน': t.amount,
    'หมายเหตุ': t.note ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const filePath = `${Paths.document}/expense_${Date.now()}.xlsx`;
  const file = new File(filePath);
  file.write(wbout, { encoding: 'base64' });

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function exportToText(transactions: Transaction[]) {
  const { formatCurrency, formatRelativeDate } = require('@/lib/utils/format');

  // Group by date
  const grouped = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (!grouped.has(tx.date)) grouped.set(tx.date, []);
    grouped.get(tx.date)!.push(tx);
  }

  const lines: string[] = [];
  for (const [date, txs] of Array.from(grouped.entries()).sort(([a], [b]) => b.localeCompare(a))) {
    lines.push(`=== ${formatRelativeDate(date)} (${date}) ===`);
    for (const tx of txs) {
      const typeLabel = tx.type === 'income' ? 'รายรับ' : 'รายจ่าย';
      const catName = tx.category?.name ?? 'อื่นๆ';
      const walletName = tx.wallet?.name ?? 'เงินสด';
      const noteStr = tx.note ? ` - ${tx.note}` : '';
      lines.push(`[${typeLabel}] ${catName}: ${formatCurrency(tx.amount)} (${walletName})${noteStr}`);
    }
    lines.push('');
  }

  const text = lines.join('\n');
  const filePath = `${Paths.document}/expense_${Date.now()}.txt`;
  const file = new File(filePath);
  file.write(text);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/utils/export.ts
git commit -m "feat: add exportToExcel and exportToText functions"
```

---

### Task 9: Create import utility

**Files:**
- Create: `lib/utils/import.ts`

- [ ] **Step 1: Create `lib/utils/import.ts`**

```typescript
import { File } from 'expo-file-system/next';
import type { Category, TransactionType } from '@/types';
import { getDb, insertTransaction, getAllCategories, getAllWallets } from '@/lib/stores/db';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importFromExcel(uri: string): Promise<ImportResult> {
  const XLSX = require('xlsx');
  const db = getDb();
  const categories = await getAllCategories(db);
  const wallets = await getAllWallets(db);

  const file = new File(uri);
  const base64 = file.base64();
  const wb = XLSX.read(base64, { type: 'base64' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const date = String(row['วันที่'] ?? '').trim();
      const typeStr = String(row['ประเภท'] ?? '').trim();
      const catName = String(row['หมวดหมู่'] ?? '').trim();
      const amount = Number(row['จำนวนเงิน']);
      const note = String(row['หมายเหตุ'] ?? '').trim() || undefined;
      const walletName = String(row['กระเป๋าเงิน'] ?? '').trim();

      if (!date || !typeStr || !catName || !amount || isNaN(amount)) {
        result.skipped++;
        result.errors.push(`แถว ${i + 2}: ข้อมูลไม่ครบ`);
        continue;
      }

      const type: TransactionType = typeStr === 'รายรับ' ? 'income' : 'expense';
      const category = categories.find(c => c.name === catName && c.type === type);
      if (!category) {
        result.skipped++;
        result.errors.push(`แถว ${i + 2}: ไม่พบหมวด "${catName}"`);
        continue;
      }

      const wallet = wallets.find(w => w.name === walletName);
      const walletId = wallet?.id ?? 'wallet-cash';

      await insertTransaction(db, { type, amount, categoryId: category.id, walletId, note, date });
      result.imported++;
    } catch (e: any) {
      result.skipped++;
      result.errors.push(`แถว ${i + 2}: ${e.message}`);
    }
  }

  return result;
}

export async function importFromText(uri: string): Promise<ImportResult> {
  const db = getDb();
  const categories = await getAllCategories(db);
  const wallets = await getAllWallets(db);

  const file = new File(uri);
  const content = file.text();
  const lines = content.split('\n');

  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  let currentDate = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Date header: === date (YYYY-MM-DD) ===
    const dateMatch = line.match(/===.*\((\d{4}-\d{2}-\d{2})\).*===/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }

    // Transaction line: [ประเภท] หมวด: ฿amount (กระเป๋า) - note
    const txMatch = line.match(/^\[(รายรับ|รายจ่าย)\]\s+(.+?):\s+฿?([\d,.]+)\s*(?:\((.+?)\))?(?:\s*-\s*(.+))?$/);
    if (!txMatch || !currentDate) continue;

    try {
      const type: TransactionType = txMatch[1] === 'รายรับ' ? 'income' : 'expense';
      const catName = txMatch[2].trim();
      const amount = parseFloat(txMatch[3].replace(/,/g, ''));
      const walletName = txMatch[4]?.trim() ?? '';
      const note = txMatch[5]?.trim() || undefined;

      if (isNaN(amount) || amount <= 0) {
        result.skipped++;
        continue;
      }

      const category = categories.find(c => c.name === catName && c.type === type);
      if (!category) {
        result.skipped++;
        result.errors.push(`บรรทัด ${i + 1}: ไม่พบหมวด "${catName}"`);
        continue;
      }

      const wallet = wallets.find(w => w.name === walletName);
      const walletId = wallet?.id ?? 'wallet-cash';

      await insertTransaction(db, { type, amount, categoryId: category.id, walletId, note, date: currentDate });
      result.imported++;
    } catch (e: any) {
      result.skipped++;
      result.errors.push(`บรรทัด ${i + 1}: ${e.message}`);
    }
  }

  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/utils/import.ts
git commit -m "feat: create import utility for Excel and Text files"
```

---

### Task 10: Build categories management screen

**Files:**
- Modify: `app/settings/categories.tsx`

- [ ] **Step 1: Rewrite categories.tsx**

Replace entire file:

```typescript
import { View, Text, Pressable, SectionList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryStore } from '@/lib/stores/category-store';
import type { Category, TransactionType } from '@/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

const CATEGORY_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#B0B0B0', '#2ECC71', '#F39C12', '#8B5CF6', '#EC4899'];
const CATEGORY_ICONS = ['fast-food', 'car', 'home', 'medkit', 'game-controller', 'shirt', 'book', 'cash', 'briefcase', 'gift', 'build', 'cart', 'football', 'musical-notes', 'paw', 'airplane'];

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%'], []);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);

  const isEditing = !!editingCategory;

  const sections = useMemo(() => [
    { title: 'รายจ่าย', data: categories.filter(c => c.type === 'expense') },
    { title: 'รายรับ', data: categories.filter(c => c.type === 'income') },
  ], [categories]);

  const resetForm = useCallback(() => {
    setEditingCategory(null);
    setName('');
    setSelectedType('expense');
    setSelectedIcon(CATEGORY_ICONS[0]);
    setSelectedColor(CATEGORY_COLORS[0]);
  }, []);

  const openAddForm = useCallback(() => {
    resetForm();
    bottomSheetRef.current?.snapToIndex(0);
  }, [resetForm]);

  const openEditForm = useCallback((cat: Category) => {
    if (!cat.isCustom) return;
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedType(cat.type);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;

    if (isEditing && editingCategory) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
    } else {
      await addCategory({
        name: name.trim(),
        type: selectedType,
        icon: selectedIcon,
        color: selectedColor,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    bottomSheetRef.current?.close();
  }, [name, selectedType, selectedIcon, selectedColor, isEditing, editingCategory, addCategory, updateCategory, resetForm]);

  const handleDelete = useCallback((cat: Category) => {
    if (!cat.isCustom) return;
    Alert.alert('ลบหมวดหมู่', `ต้องการลบ "${cat.name}" ?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteCategory(cat.id) },
    ]);
  }, [deleteCategory]);

  const renderItem = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() => openEditForm(item)}
      onLongPress={() => handleDelete(item)}
      className="flex-row items-center px-4 py-3 bg-card border-b border-border"
    >
      <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: item.color }}>
        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color="white" />
      </View>
      <Text className="text-foreground font-medium flex-1">{item.name}</Text>
      {item.isCustom && (
        <View className="bg-secondary px-2 py-0.5 rounded">
          <Text className="text-muted-foreground text-xs">กำหนดเอง</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem as any}
        renderSectionHeader={({ section }: any) => (
          <View className="px-4 py-2 bg-background">
            <Text className="text-muted-foreground text-xs font-semibold uppercase">{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
      />

      <Pressable
        onPress={openAddForm}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

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
            {isEditing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
          </Text>

          <Text className="text-foreground font-semibold mb-2">ชื่อ</Text>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder="ชื่อหมวดหมู่"
            placeholderTextColor="#999"
            style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 }}
          />

          {!isEditing && (
            <>
              <Text className="text-foreground font-semibold mb-2">ประเภท</Text>
              <View className="flex-row mb-4 rounded-xl overflow-hidden border border-border">
                <Pressable
                  onPress={() => setSelectedType('expense')}
                  className={`flex-1 py-2.5 items-center ${selectedType === 'expense' ? 'bg-expense' : 'bg-card'}`}
                >
                  <Text className={`font-semibold ${selectedType === 'expense' ? 'text-white' : 'text-foreground'}`}>รายจ่าย</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedType('income')}
                  className={`flex-1 py-2.5 items-center ${selectedType === 'income' ? 'bg-income' : 'bg-card'}`}
                >
                  <Text className={`font-semibold ${selectedType === 'income' ? 'text-white' : 'text-foreground'}`}>รายรับ</Text>
                </Pressable>
              </View>
            </>
          )}

          <Text className="text-foreground font-semibold mb-2">ไอคอน</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORY_ICONS.map(icon => (
              <Pressable
                key={icon}
                onPress={() => setSelectedIcon(icon)}
                className={`w-10 h-10 rounded-full items-center justify-center ${selectedIcon === icon ? 'border-2 border-primary' : 'bg-secondary'}`}
              >
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={selectedIcon === icon ? '#0891b2' : '#666'} />
              </Pressable>
            ))}
          </View>

          <Text className="text-foreground font-semibold mb-2">สี</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {CATEGORY_COLORS.map(color => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                className={`w-9 h-9 rounded-full items-center justify-center ${selectedColor === color ? 'border-2 border-foreground' : ''}`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <Ionicons name="checkmark" size={18} color="white" />}
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-xl items-center bg-primary ${!name.trim() ? 'opacity-50' : ''}`}
            disabled={!name.trim()}
          >
            <Text className="text-white font-bold text-lg">{isEditing ? 'อัพเดท' : 'เพิ่ม'}</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/settings/categories.tsx
git commit -m "feat: implement categories management screen"
```

---

### Task 11: Build alerts settings screen

**Files:**
- Modify: `app/settings/alerts.tsx`

- [ ] **Step 1: Rewrite alerts.tsx**

Replace entire file:

```typescript
import { View, Text, Pressable, ScrollView, Switch, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { formatCurrency } from '@/lib/utils/format';
import { useState } from 'react';

export default function AlertsScreen() {
  const {
    isMonthlyTargetEnabled,
    monthlyExpenseTarget,
    isCategoryLimitsEnabled,
    categoryLimits,
    updateAlertSettings,
    addCategoryLimit,
    removeCategoryLimit,
  } = useAlertSettingsStore();

  const categories = useCategoryStore(s => s.categories);
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const [targetInput, setTargetInput] = useState(monthlyExpenseTarget > 0 ? String(monthlyExpenseTarget) : '');

  const handleTargetSave = () => {
    const value = parseFloat(targetInput) || 0;
    updateAlertSettings({ monthlyExpenseTarget: value });
  };

  const handleAddLimit = () => {
    const available = expenseCategories.filter(c => !categoryLimits.some(l => l.categoryId === c.id));
    if (available.length === 0) {
      Alert.alert('ครบแล้ว', 'ตั้งเป้าทุกหมวดหมู่แล้ว');
      return;
    }

    Alert.prompt(
      'ตั้งเป้าหมวดหมู่',
      `เลือก: ${available.map((c, i) => `${i + 1}.${c.name}`).join(' ')}  \nใส่: หมายเลข,จำนวนเงิน (เช่น 1,5000)`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'เพิ่ม',
          onPress: (input?: string) => {
            if (!input) return;
            const parts = input.split(',');
            const idx = parseInt(parts[0]) - 1;
            const limit = parseFloat(parts[1]);
            if (idx >= 0 && idx < available.length && limit > 0) {
              addCategoryLimit(available[idx].id, limit);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView>
        {/* Monthly Target */}
        <View className="px-4 py-2 bg-background">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">เป้ารายจ่ายรายเดือน</Text>
        </View>
        <View className="px-4 py-4 bg-card border-b border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-medium">เปิดใช้งาน</Text>
            <Switch
              value={isMonthlyTargetEnabled}
              onValueChange={(v) => updateAlertSettings({ isMonthlyTargetEnabled: v })}
              trackColor={{ true: '#0891b2' }}
            />
          </View>
          {isMonthlyTargetEnabled && (
            <View className="flex-row items-center">
              <Text className="text-foreground text-lg mr-2">฿</Text>
              <TextInput
                value={targetInput}
                onChangeText={setTargetInput}
                onBlur={handleTargetSave}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                className="flex-1 text-foreground text-lg border-b border-border py-1"
              />
            </View>
          )}
        </View>

        {/* Category Limits */}
        <View className="px-4 py-2 bg-background mt-4">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">เป้าตามหมวดหมู่</Text>
        </View>
        <View className="px-4 py-4 bg-card border-b border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-medium">เปิดใช้งาน</Text>
            <Switch
              value={isCategoryLimitsEnabled}
              onValueChange={(v) => updateAlertSettings({ isCategoryLimitsEnabled: v })}
              trackColor={{ true: '#0891b2' }}
            />
          </View>
        </View>

        {isCategoryLimitsEnabled && (
          <>
            {categoryLimits.map(limit => {
              const cat = categories.find(c => c.id === limit.categoryId);
              if (!cat) return null;
              return (
                <Pressable
                  key={limit.categoryId}
                  onLongPress={() => {
                    Alert.alert('ลบเป้า', `ลบเป้า "${cat.name}" ?`, [
                      { text: 'ยกเลิก', style: 'cancel' },
                      { text: 'ลบ', style: 'destructive', onPress: () => removeCategoryLimit(limit.categoryId) },
                    ]);
                  }}
                  className="flex-row items-center px-4 py-3 bg-card border-b border-border"
                >
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: cat.color }}>
                    <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
                  </View>
                  <Text className="text-foreground flex-1">{cat.name}</Text>
                  <Text className="text-foreground font-semibold">{formatCurrency(limit.limit)}</Text>
                </Pressable>
              );
            })}

            <Pressable onPress={handleAddLimit} className="flex-row items-center justify-center px-4 py-3 bg-card border-b border-border">
              <Ionicons name="add-circle-outline" size={20} color="#0891b2" />
              <Text className="text-primary font-medium ml-2">เพิ่มเป้าหมวดหมู่</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/settings/alerts.tsx
git commit -m "feat: implement budget alerts settings screen"
```

---

### Task 12: Build theme picker screen

**Files:**
- Modify: `app/settings/theme.tsx`

- [ ] **Step 1: Rewrite theme.tsx**

Replace entire file:

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/lib/stores/theme-store';
import * as Haptics from 'expo-haptics';

const THEMES = [
  { key: 'light', name: 'สว่าง', bg: '#ffffff', primary: '#171717', card: '#ffffff' },
  { key: 'dark', name: 'มืด', bg: '#0a0a0a', primary: '#fafafa', card: '#171717' },
  { key: 'zinc', name: 'ซิงค์', bg: '#fafafa', primary: '#18181b', card: '#ffffff' },
  { key: 'stone', name: 'สโตน', bg: '#fafaf9', primary: '#1c1917', card: '#ffffff' },
  { key: 'cyan', name: 'ฟ้า', bg: '#ecfeff', primary: '#0891b2', card: '#ffffff' },
  { key: 'sky', name: 'ท้องฟ้า', bg: '#f0f9ff', primary: '#0284c7', card: '#ffffff' },
  { key: 'teal', name: 'เขียวน้ำทะเล', bg: '#f0fdfa', primary: '#0d9488', card: '#ffffff' },
  { key: 'gray', name: 'เทา', bg: '#f9fafb', primary: '#111827', card: '#ffffff' },
  { key: 'neutral', name: 'ธรรมชาติ', bg: '#fafafa', primary: '#0a0a0a', card: '#ffffff' },
];

export default function ThemeScreen() {
  const { currentTheme, setTheme } = useThemeStore();

  const handleSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(key);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-muted-foreground text-sm mb-4">เลือกธีมสำหรับแอป</Text>

        <View className="flex-row flex-wrap gap-3">
          {THEMES.map(theme => {
            const isSelected = currentTheme === theme.key;
            return (
              <Pressable
                key={theme.key}
                onPress={() => handleSelect(theme.key)}
                className={`w-[31%] rounded-2xl overflow-hidden border-2 ${isSelected ? 'border-primary' : 'border-border'}`}
              >
                {/* Preview */}
                <View style={{ backgroundColor: theme.bg }} className="p-3 h-24 justify-between">
                  <View style={{ backgroundColor: theme.card }} className="rounded-lg p-2 flex-1 justify-center border border-border">
                    <View className="flex-row items-center">
                      <View style={{ backgroundColor: theme.primary }} className="w-4 h-4 rounded-full mr-2" />
                      <View style={{ backgroundColor: theme.primary, opacity: 0.3 }} className="h-2 flex-1 rounded" />
                    </View>
                  </View>
                </View>

                {/* Label */}
                <View className={`py-2 items-center ${isSelected ? 'bg-primary' : 'bg-card'}`}>
                  {isSelected && <Ionicons name="checkmark-circle" size={16} color="white" style={{ position: 'absolute', top: -8, right: 4 }} />}
                  <Text className={`text-xs font-semibold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {theme.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/settings/theme.tsx
git commit -m "feat: implement theme picker screen with 9 themes"
```

---

### Task 13: Build export/import screen

**Files:**
- Modify: `app/settings/export.tsx`

- [ ] **Step 1: Rewrite export.tsx**

Replace entire file:

```typescript
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDb, getAllTransactions } from '@/lib/stores/db';
import { exportToCSV, exportToExcel, exportToText } from '@/lib/utils/export';
import { importFromExcel, importFromText } from '@/lib/utils/import';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

export default function ExportScreen() {
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const [importing, setImporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'text') => {
    try {
      const db = getDb();
      const allTx = await getAllTransactions(db);
      if (allTx.length === 0) {
        Alert.alert('ไม่มีข้อมูล', 'ยังไม่มีรายการสำหรับส่งออก');
        return;
      }

      if (format === 'csv') await exportToCSV(allTx);
      else if (format === 'excel') await exportToExcel(allTx);
      else await exportToText(allTx);
    } catch {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  const handleImport = async (format: 'excel' | 'text') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const uri = result.assets[0].uri;

      setImporting(true);

      const importResult = format === 'excel'
        ? await importFromExcel(uri)
        : await importFromText(uri);

      setImporting(false);
      await loadTransactions();

      Alert.alert(
        'นำเข้าเสร็จสิ้น',
        `นำเข้าสำเร็จ: ${importResult.imported} รายการ\nข้าม: ${importResult.skipped} รายการ${
          importResult.errors.length > 0 ? `\n\nปัญหา:\n${importResult.errors.slice(0, 5).join('\n')}` : ''
        }`
      );
    } catch {
      setImporting(false);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถนำเข้าข้อมูลได้');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView>
        {/* Export Section */}
        <View className="px-4 py-2 bg-background">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">ส่งออกข้อมูล</Text>
        </View>

        <ExportButton icon="document-text-outline" label="ส่งออก CSV" onPress={() => handleExport('csv')} />
        <ExportButton icon="grid-outline" label="ส่งออก Excel (.xlsx)" onPress={() => handleExport('excel')} />
        <ExportButton icon="reader-outline" label="ส่งออก Text (.txt)" onPress={() => handleExport('text')} />

        {/* Import Section */}
        <View className="px-4 py-2 bg-background mt-4">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">นำเข้าข้อมูล</Text>
        </View>

        <ExportButton
          icon="cloud-upload-outline"
          label={importing ? 'กำลังนำเข้า...' : 'นำเข้าจาก Excel'}
          onPress={() => handleImport('excel')}
          disabled={importing}
        />
        <ExportButton
          icon="document-outline"
          label={importing ? 'กำลังนำเข้า...' : 'นำเข้าจาก Text'}
          onPress={() => handleImport('text')}
          disabled={importing}
        />

        <View className="px-4 py-3">
          <Text className="text-muted-foreground text-xs">
            หมายเหตุ: การนำเข้าจะเพิ่มรายการใหม่ ไม่ลบรายการเดิม ชื่อหมวดหมู่ต้องตรงกับที่มีในแอป
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExportButton({ icon, label, onPress, disabled }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center px-4 py-4 bg-card border-b border-border ${disabled ? 'opacity-50' : ''}`}
    >
      <Ionicons name={icon} size={22} color="#666" />
      <Text className="flex-1 text-foreground ml-3">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </Pressable>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/settings/export.tsx
git commit -m "feat: implement export/import screen with CSV, Excel, Text"
```

---

### Task 14: Verify TypeScript compilation

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. Fix any that appear.

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors from Phase 4 changes"
```

---

### Summary

| Task | Description | Files |
|------|------------|-------|
| 1 | Install xlsx + expo-document-picker | package.json |
| 2 | updateCategory DB query + store action | db.ts, category-store.ts |
| 3 | Alert settings store | alert-settings-store.ts (new) |
| 4 | Theme store | theme-store.ts (new) |
| 5 | App boot: load stores + apply theme | _layout.tsx |
| 6 | AlertBanner component | AlertBanner.tsx (new) |
| 7 | AlertBanner on HomeScreen | index.tsx |
| 8 | exportToExcel + exportToText | export.ts |
| 9 | Import utility | import.ts (new) |
| 10 | Categories management screen | categories.tsx |
| 11 | Alerts settings screen | alerts.tsx |
| 12 | Theme picker screen | theme.tsx |
| 13 | Export/Import screen | export.tsx |
| 14 | TypeScript verification | all |
