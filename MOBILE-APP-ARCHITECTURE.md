# Mobile CEAS Flow - Architecture Document for React Native Migration

> **Source:** Next.js 16 PWA (TypeScript + Tailwind + Zustand + Dexie/IndexedDB)
> **Target:** React Native Mobile App
> **Generated:** 2026-04-11

---

## 1. App Overview

**ชื่อแอป:** Mobile CEAS Flow / Pay Flow
**วัตถุประสงค์:** แอปจัดการการเงินส่วนบุคคล - ติดตามรายรับ/รายจ่าย พร้อม AI วิเคราะห์การเงิน
**ภาษา:** Thai (th-TH locale)
**สกุลเงิน:** THB (บาท)

### Features หลัก
1. **Transaction Management** - บันทึกรายรับ/รายจ่ายพร้อม calculator keypad
2. **Multi-Wallet** - รองรับ 6 ประเภทกระเป๋าเงิน
3. **Category System** - 30 หมวดรายจ่าย + 14 หมวดรายรับ + สร้างเพิ่มเอง
4. **Analytics & Charts** - กราฟวิเคราะห์ Pie/Bar ตามหมวดหมู่
5. **AI Analysis** - วิเคราะห์การเงินผ่าน Google Gemini
6. **Budget Alerts** - แจ้งเตือนเมื่อใช้จ่ายเกินเป้า
7. **Export/Import** - ส่งออก/นำเข้า Excel + Text
8. **Frequent Transactions** - รายการใช้บ่อยเพื่อบันทึกเร็ว
9. **Theme System** - 9 ธีม (light/dark + สีต่างๆ)

---

## 2. Technology Stack Mapping (Next.js -> React Native)

| Layer | Current (Next.js PWA) | Recommended (React Native) |
|-------|----------------------|---------------------------|
| **Framework** | Next.js 16 (App Router) | React Native + Expo |
| **Navigation** | Custom Tab Hook | React Navigation (Bottom Tabs + Stack) |
| **UI Components** | shadcn/ui + Radix UI | React Native Paper / NativeWind / Tamagui |
| **Styling** | Tailwind CSS 4 | NativeWind (Tailwind for RN) หรือ StyleSheet |
| **State Management** | Zustand 5 | Zustand 5 (ใช้ได้เลย!) |
| **Local Database** | Dexie (IndexedDB) | WatermelonDB / SQLite (expo-sqlite) |
| **Charts** | Chart.js + react-chartjs-2 | react-native-chart-kit / Victory Native |
| **AI Integration** | Google Generative AI API | เหมือนเดิม (API call) |
| **Export** | xlsx library | react-native-share + xlsx |
| **Icons** | lucide-react | lucide-react-native |
| **Date/Time** | Native Date | date-fns หรือ dayjs |
| **Storage** | localStorage | AsyncStorage / MMKV |

---

## 3. Screen Structure (Navigation Map)

### Current: 4-Tab Single Page App
### Target: React Navigation Bottom Tabs

```
BottomTabNavigator
├── HomeStack
│   ├── HomeScreen (รายการธุรกรรม + สรุปรายเดือน)
│   ├── AddTransactionScreen (Modal/Sheet)
│   ├── EditTransactionScreen (Modal/Sheet)
│   └── TransactionDetailScreen (Optional)
│
├── AnalyticsStack
│   ├── AnalyticsScreen (Tab: Stats | Wallets)
│   │   ├── StatsView (Pie/Bar charts ตามหมวดหมู่)
│   │   └── WalletsView (เปรียบเทียบยอดกระเป๋าเงิน)
│   └── CategoryDetailScreen (Optional - drill down)
│
├── AiAnalysisStack
│   ├── AiAnalysisScreen (เลือกปี/กระเป๋าเงิน + วิเคราะห์)
│   └── AiResultScreen (แสดงผลวิเคราะห์)
│
└── MoreStack (Settings)
    ├── MoreScreen (รายการเมนูตั้งค่า)
    ├── WalletManageScreen (จัดการกระเป๋าเงิน)
    ├── CategoryManageScreen (จัดการหมวดหมู่)
    ├── AlertSettingsScreen (ตั้งเป้าใช้จ่าย)
    ├── ExportScreen (ส่งออกข้อมูล)
    ├── ImportScreen (นำเข้าข้อมูล)
    └── ThemeScreen (เปลี่ยนธีม)
```

---

## 4. Data Models (TypeScript Interfaces)

### 4.1 Transaction

```typescript
// ประเภทธุรกรรม
type TransactionType = 'expense' | 'income';

// ข้อมูลธุรกรรม
interface Transaction {
  id: string;              // UUID
  walletId: string;        // FK -> Wallet
  categoryId: string;      // FK -> Category
  type: TransactionType;
  amount: number;          // จำนวนเงิน
  currency: string;        // สกุลเงิน (default: 'THB')
  date: Date;              // วันที่ทำรายการ
  note?: string;           // หมายเหตุ
  imageUrl?: string;       // รูปแนบ (optional)
  createdAt: Date;
  updatedAt: Date;
}

// ธุรกรรมพร้อมข้อมูลหมวดหมู่ (สำหรับแสดงผล)
interface TransactionWithCategory extends Transaction {
  category: Category;
  wallet?: Wallet;
}

// Input สำหรับสร้าง/แก้ไขธุรกรรม
interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId?: string;
  date?: Date;
  note?: string;
}

// สรุปรายวัน
interface DailySummary {
  date: Date;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
}

// ยอดคงเหลือกระเป๋าเงิน
interface WalletBalance {
  income: number;
  expense: number;
  balance: number;
}
```

### 4.2 Wallet

```typescript
type WalletType = 'cash' | 'bank' | 'credit_card' | 'e_wallet' | 'savings' | 'daily_expense';

interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  icon: string;             // emoji/icon identifier
  color: string;            // hex color
  currency: string;         // default: 'THB'
  initialBalance: number;   // ยอดเริ่มต้น
  currentBalance: number;   // ยอดปัจจุบัน (คำนวณจาก transactions)
  isAsset: boolean;         // เป็นสินทรัพย์หรือไม่
  createdAt: Date;
}
```

### 4.3 Category

```typescript
interface Category {
  id: string;
  name: string;             // ชื่อหมวดหมู่ (Thai)
  type: 'expense' | 'income';
  order?: number;           // ลำดับการแสดง
  icon?: string;            // emoji icon
  color?: string;           // hex color
  notes?: string[];         // บันทึกที่ใช้บ่อย (max 50, FIFO)
}

// สรุปตามหมวดหมู่ (สำหรับ Analytics)
interface CategorySummary {
  category: Category;
  amount: number;
  percentage: number;
  transactionCount: number;
}
```

### 4.4 AI Analysis

```typescript
type AiPromptType = 'compact' | 'structured' | 'full';

interface AiHistory {
  id: string;
  walletId: string | null;  // null = วิเคราะห์ทุกกระเป๋า
  promptType: AiPromptType;
  year: number;
  responseType: 'structured' | 'full' | 'text';
  responseData: string;     // JSON stringified
  createdAt: Date;
}

// ผลวิเคราะห์แบบ Structured
interface StructuredResult {
  summary: {
    healthScore: string;       // เช่น "B+" หรือ "A-"
    totalIncome: number;
    totalExpense: number;
    savingRate: number;        // อัตราการออม (%)
    rule503020: {
      needs: number;           // ความจำเป็น 50%
      wants: number;           // ความต้องการ 30%
      savings: number;         // ออม/ลงทุน 20%
    };
  };
  recommendations: {
    monthlySaving: number;     // เป้าออมรายเดือน
    monthlyInvestment: number; // เป้าลงทุนรายเดือน
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
  actionPlan: string[];       // แผนปฏิบัติ
  warnings: string[];         // คำเตือน
}
```

### 4.5 Alert Settings

```typescript
interface AlertSettings {
  monthlyExpenseTarget: number;      // เป้ารายจ่ายรายเดือน
  isMonthlyTargetEnabled: boolean;
  categoryLimits: CategoryLimit[];   // จำกัดตามหมวดหมู่
  isCategoryLimitsEnabled: boolean;
}

interface CategoryLimit {
  categoryId: string;
  limit: number;
}
```

### 4.6 App Settings

```typescript
interface AppSettings {
  autoOpenTransaction: boolean;      // เปิดฟอร์มเพิ่มอัตโนมัติ
  frequentOnHome: boolean;           // แสดงรายการใช้บ่อยบน Home
  frequentOnHomeCount: number;       // จำนวนรายการใช้บ่อย (default: 6)
  frequentOnAddSheet: boolean;       // แสดงรายการใช้บ่อยในฟอร์มเพิ่ม
}
```

### 4.7 Duplicate Analysis

```typescript
type MatchType = 'basic' | 'full';

interface Analysis {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  note?: string;
  matchType: MatchType;       // basic = category+amount, full = +note
  count: number;              // จำนวนครั้งที่ซ้ำ
  lastTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. State Management (Zustand Stores)

> Zustand ใช้ได้ใน React Native โดยตรง เปลี่ยนเฉพาะ persistence layer

### 5.1 Store Overview

| Store | หน้าที่ | Persistence |
|-------|---------|-------------|
| `transaction-store` | CRUD ธุรกรรม + คำนวณสรุป | SQLite/WatermelonDB |
| `wallet-store` | จัดการกระเป๋าเงิน | SQLite/WatermelonDB |
| `category-store` | จัดการหมวดหมู่ + notes | SQLite/WatermelonDB |
| `analysis-store` | ตรวจจับรายการซ้ำ | SQLite/WatermelonDB |
| `ai-history-store` | เก็บผล AI วิเคราะห์ | SQLite/WatermelonDB |
| `alert-settings-store` | ตั้งเป้าใช้จ่าย | AsyncStorage/MMKV |
| `settings-store` | ตั้งค่าแอป | AsyncStorage/MMKV |
| `theme-store` | ธีมสี | AsyncStorage/MMKV |

### 5.2 Transaction Store (หลัก)

```typescript
interface TransactionStore {
  // State
  transactions: TransactionWithCategory[];
  dailySummaries: DailySummary[];
  monthlySummary: { income: number; expense: number };
  walletBalances: Record<string, WalletBalance>;
  selectedMonth: Date;
  selectedDay: Date | null;
  selectedWalletId: string | null;
  isLoading: boolean;
  toastVisible: boolean;
  toastType: 'success' | 'error' | 'info';

  // Actions
  loadTransactions(): Promise<void>;
  addTransaction(input: TransactionInput): Promise<void>;
  updateTransaction(id: string, input: TransactionInput): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  deleteTransactionsByWalletId(walletId: string): Promise<void>;
  getTransactionById(id: string): Transaction | undefined;
  getWalletBalance(walletId: string): WalletBalance;
  setSelectedMonth(date: Date): void;
  setSelectedDay(date: Date | null): void;
  setSelectedWalletId(id: string | null): void;
}
```

**Pattern สำคัญ: Optimistic Updates**
```
User Action -> Update Zustand State ทันที -> Render UI ใหม่
                    ↓ (async)
             Persist to Database
```

### 5.3 Wallet Store

```typescript
interface WalletStore {
  wallets: Wallet[];
  isLoading: boolean;
  isInitialized: boolean;

  loadWallets(): Promise<void>;
  getWalletById(id: string): Wallet | undefined;
  addWallet(data: Partial<Wallet>): Promise<void>;
  updateWallet(id: string, updates: Partial<Wallet>): Promise<void>;
  deleteWallet(id: string): Promise<void>;
}
```

### 5.4 Category Store

```typescript
interface CategoryStore {
  expenseCategories: Category[];
  incomeCategories: Category[];
  isLoading: boolean;
  isInitialized: boolean;

  loadCategories(): Promise<void>;
  addCategory(input: CategoryInput): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  getCategoryById(id: string): Category | undefined;
  getAllCategories(): Category[];
  reorderCategories(type: string, categories: Category[]): Promise<void>;
  addNoteToCategory(id: string, note: string): Promise<void>;
  getNotesForCategory(id: string): string[];
  removeNoteFromCategory(id: string, note: string): Promise<void>;
}
```

---

## 6. Database Schema (สำหรับ SQLite/WatermelonDB)

### 6.1 Tables

```sql
-- ธุรกรรม
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'THB',
  date TEXT NOT NULL,          -- ISO 8601
  note TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL,    -- ISO 8601
  updated_at TEXT NOT NULL     -- ISO 8601
);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- กระเป๋าเงิน
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('cash','bank','credit_card','e_wallet','savings','daily_expense')) NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  currency TEXT DEFAULT 'THB',
  initial_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  is_asset INTEGER DEFAULT 1,  -- boolean
  created_at TEXT NOT NULL
);

-- หมวดหมู่
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  notes TEXT                   -- JSON array string
);

-- ประวัติวิเคราะห์ AI
CREATE TABLE ai_history (
  id TEXT PRIMARY KEY,
  wallet_id TEXT,
  prompt_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  response_type TEXT NOT NULL,
  response_data TEXT NOT NULL,  -- JSON string
  created_at TEXT NOT NULL
);

-- วิเคราะห์รายการซ้ำ
CREATE TABLE analysis (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  match_type TEXT CHECK(match_type IN ('basic', 'full')) NOT NULL,
  count INTEGER DEFAULT 1,
  last_transaction_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 7. Component Architecture (React Native)

### 7.1 Shared Components (ย้ายได้เลย)

| Component (Web) | React Native Equivalent | หมายเหตุ |
|-----------------|------------------------|----------|
| `Button` | `Pressable` / Paper `Button` | |
| `Card` | `View` with shadow style | |
| `Sheet` (Bottom) | `@gorhom/bottom-sheet` | สำคัญ! ใช้เยอะมาก |
| `Dialog` | `Modal` / Paper `Dialog` | |
| `Input` | `TextInput` | |
| `Switch` | `Switch` (RN core) | |
| `Tabs` | `react-native-tab-view` | |
| `ScrollArea` | `ScrollView` / `FlatList` | |
| `Badge` | Custom `View` + `Text` | |
| `Progress` | `ProgressBar` | |
| `DateTimePicker` | `@react-native-community/datetimepicker` | |
| `AlertBanner` | Custom component | |

### 7.2 Feature Components

```
components/
├── common/
│   ├── CurrencyDisplay.tsx       # แสดงจำนวนเงินรูปแบบ Thai
│   ├── MonthPicker.tsx           # เลือกเดือน
│   ├── WalletSelector.tsx        # เลือกกระเป๋าเงิน
│   ├── EmptyState.tsx            # หน้าว่าง
│   └── CalculatorPad.tsx         # แป้นกดเครื่องคิดเลข
│
├── transaction/
│   ├── TransactionList.tsx       # FlatList ธุรกรรม
│   ├── TransactionCard.tsx       # การ์ดธุรกรรมเดี่ยว
│   ├── DayGroup.tsx              # กลุ่มรายวัน (SectionList header)
│   ├── SummaryBar.tsx            # แถบสรุปรายเดือน
│   ├── AddTransactionSheet.tsx   # Bottom Sheet เพิ่มรายการ
│   ├── EditTransactionSheet.tsx  # Bottom Sheet แก้ไข
│   ├── TypeSelector.tsx          # สลับ รายจ่าย/รายรับ
│   ├── CategorySelector.tsx      # Modal เลือกหมวดหมู่
│   ├── CategoryScroll.tsx        # ScrollView แนวนอน
│   ├── FrequentTransactions.tsx  # รายการใช้บ่อย
│   ├── WalletPickerModal.tsx     # Modal เลือกกระเป๋า
│   └── CalculatorKeypad.tsx      # แป้นกดคำนวณ
│
├── analytics/
│   ├── AnalyticsContent.tsx      # กราฟวิเคราะห์
│   ├── WalletsContent.tsx        # เปรียบเทียบกระเป๋า
│   └── FilterBar.tsx             # ตัวกรอง
│
├── ai/
│   ├── AiAnalysisView.tsx        # หน้าวิเคราะห์ AI
│   └── AiResultView.tsx          # แสดงผลวิเคราะห์
│
└── settings/
    ├── SettingMenuItem.tsx        # รายการเมนูตั้งค่า
    ├── ExportCard.tsx             # ปุ่มส่งออก
    ├── AlertSettingCard.tsx       # ตั้งเป้าใช้จ่าย
    └── StorageInfoCard.tsx        # ข้อมูลพื้นที่เก็บ
```

---

## 8. API Integration

### 8.1 AI Analysis Endpoint

```typescript
// POST /api/ai
// สำหรับ React Native: เปลี่ยนเป็น API server แยก หรือเรียก Gemini ตรงจากแอป

interface AiRequest {
  year: number;
  walletId: string | null;   // null = ทุกกระเป๋า
  promptType: 'structured' | 'full';
  transactionData: string;    // JSON transactions
}

interface AiResponse {
  success: boolean;
  result: StructuredResult | FullResult;
  remaining: number;          // โควต้าคงเหลือ (4/วัน/IP)
}
```

**ทางเลือกสำหรับ React Native:**
1. **Backend API (แนะนำ):** ตั้ง server แยก (Express/Fastify) เก็บ API key ฝั่ง server
2. **Direct API call:** เรียก Gemini API จากแอปตรง (ไม่ปลอดภัย - API key อยู่ในแอป)
3. **Cloud Function:** ใช้ Firebase Functions / Supabase Edge Functions

### 8.2 Rate Limiting

```typescript
// ปัจจุบัน: In-memory per IP (4 requests/day)
// React Native: ใช้ device ID หรือ user ID แทน IP
const DAILY_LIMIT = 4;
```

---

## 9. Category Presets (ค่าเริ่มต้น)

### 9.1 Expense Categories (30 หมวด)

| # | Icon | Name | ID Pattern |
|---|------|------|------------|
| 1 | 🍚 | อาหาร | food |
| 2 | ☕ | เครื่องดื่ม/กาแฟ | drinks |
| 3 | 🚗 | เดินทาง | transport |
| 4 | ⛽ | น้ำมัน | fuel |
| 5 | 🚌 | ขนส่งสาธารณะ | public-transport |
| 6 | 🏠 | ค่าเช่า/ผ่อนบ้าน | rent |
| 7 | 💡 | ค่าไฟ | electricity |
| 8 | 💧 | ค่าน้ำ | water |
| 9 | 📡 | ค่าอินเทอร์เน็ต | internet |
| 10 | 📱 | โทรศัพท์ | phone |
| 11 | 🧴 | ของใช้ส่วนตัว | personal |
| 12 | 👕 | เสื้อผ้า | clothing |
| 13 | 🛍️ | ช้อปปิ้ง | shopping |
| 14 | 💊 | สุขภาพ/ยา | health |
| 15 | 🏋️ | ออกกำลังกาย | exercise |
| 16 | 🎬 | บันเทิง | entertainment |
| 17 | 🎮 | เกม | games |
| 18 | 📺 | Subscription | subscription |
| 19 | 👨‍👩‍👧 | ครอบครัว | family |
| 20 | 💕 | เดท | date |
| 21 | 🍻 | สังสรรค์ | social |
| 22 | 🎁 | ของขวัญ | gifts |
| 23 | 📚 | การศึกษา | education |
| 24 | 📖 | หนังสือ | books |
| 25 | ✈️ | ท่องเที่ยว | travel |
| 26 | 🛡️ | ประกัน | insurance |
| 27 | 💳 | ผ่อนชำระ | installment |
| 28 | 🏛️ | ภาษี | tax |
| 29 | 🐾 | สัตว์เลี้ยง | pets |
| 30 | 📌 | อื่นๆ | other-expense |

### 9.2 Income Categories (14 หมวด)

| # | Icon | Name | ID Pattern |
|---|------|------|------------|
| 1 | 💰 | เงินเดือน | salary |
| 2 | 🎉 | โบนัส | bonus |
| 3 | ⏰ | ค่าล่วงเวลา | overtime |
| 4 | 📊 | ค่าคอมมิชชั่น | commission |
| 5 | 💼 | รายได้เสริม | side-income |
| 6 | 🖥️ | ฟรีแลนซ์ | freelance |
| 7 | 🏪 | ขายของ | selling |
| 8 | 📈 | เงินปันผล | dividend |
| 9 | 🏦 | ดอกเบี้ย | interest |
| 10 | 💹 | กำไรจากการลงทุน | investment-profit |
| 11 | 🧾 | เงินคืนภาษี | tax-refund |
| 12 | 🎁 | ได้รับเงิน/ของขวัญ | gift-received |
| 13 | 🏆 | รางวัล | reward |
| 14 | 📌 | อื่นๆ | other-income |

---

## 10. Utility Functions (ย้ายได้เลย)

### 10.1 Format Utilities

```typescript
// lib/utils/format.ts - ใช้ได้ใน React Native โดยตรง

formatCurrency(amount: number, currency?: string): string
// "฿1,234.56" / "1,234.56 บาท"

formatNumber(num: number): string
// "1,234" (th-TH locale)

formatDate(date: Date): string
// "2 ม.ค. 2567" (Thai short date)

formatTime(date: Date): string
// "14:30" (HH:mm)

formatRelativeDate(date: Date): string
// "วันนี้" / "เมื่อวาน" / "2 ม.ค. 2567"

formatMonthYear(date: Date): string
// "มกราคม 2567"

isSameDay(date1: Date, date2: Date): boolean

getDayOfWeek(date: Date): string
// "จันทร์" / "อังคาร" ...

formatPercentage(value: number): string
// "45.5%"
```

### 10.2 Export Utilities

```typescript
// ต้องปรับสำหรับ React Native
// Web: ดาวน์โหลดไฟล์ -> RN: Share sheet / Save to Files

exportToExcel(transactions, wallets, categories): Promise<void>
exportToTxt(transactions, wallets, categories): Promise<void>
importFromExcel(file): Promise<ImportResult>
importFromTxt(file): Promise<ImportResult>
```

---

## 11. Business Logic สำคัญ

### 11.1 Transaction Flow

```
1. User เปิด AddTransactionSheet
2. เลือกประเภท (expense/income)
3. กดเลขจาก Calculator Keypad
4. เลือก Category (scroll/grid)
5. เลือก Wallet (optional)
6. ใส่ Note (optional)
7. เลือกวันที่ (default: วันนี้)
8. กด Save
   -> Optimistic Update: อัพเดท Zustand state ทันที
   -> Async: บันทึกลง Database
   -> คำนวณ Daily/Monthly Summary ใหม่
   -> อัพเดท Wallet Balance
   -> อัพเดท Analysis (duplicate detection)
   -> บันทึก Note ลง Category.notes (ถ้ามี)
```

### 11.2 Monthly Summary Calculation

```typescript
// คำนวณสรุปรายเดือน
function calculateMonthlySummary(transactions: Transaction[], month: Date) {
  const monthTransactions = transactions.filter(t =>
    t.date.getMonth() === month.getMonth() &&
    t.date.getFullYear() === month.getFullYear()
  );

  return {
    income: sum(monthTransactions.filter(t => t.type === 'income').map(t => t.amount)),
    expense: sum(monthTransactions.filter(t => t.type === 'expense').map(t => t.amount)),
  };
}
```

### 11.3 Wallet Balance Calculation

```typescript
// ยอดคงเหลือ = ยอดเริ่มต้น + รายรับ - รายจ่าย
function getWalletBalance(walletId: string, transactions: Transaction[]): WalletBalance {
  const walletTxns = transactions.filter(t => t.walletId === walletId);
  const income = sum(walletTxns.filter(t => t.type === 'income').map(t => t.amount));
  const expense = sum(walletTxns.filter(t => t.type === 'expense').map(t => t.amount));
  return { income, expense, balance: income - expense };
}
```

### 11.4 Budget Alert Logic

```typescript
// แจ้งเตือนเมื่อใช้จ่ายเกินเป้า
function checkBudgetAlert(monthlySummary, alertSettings): AlertState {
  if (!alertSettings.isMonthlyTargetEnabled) return null;

  const percentage = monthlySummary.expense / alertSettings.monthlyExpenseTarget * 100;

  if (percentage >= 100) return 'danger';   // เกินเป้า
  if (percentage >= 80) return 'warning';   // ใกล้เป้า
  return null;
}
```

### 11.5 Frequent Transactions

```typescript
// หารายการที่ใช้บ่อย (จาก Analysis store)
// จัดกลุ่มตาม: category + amount (basic match)
// หรือ: category + amount + note (full match)
// เรียงตาม count มากสุด -> แสดง N รายการบน (default 6)
```

---

## 12. Theme System

### 12.1 Available Themes

| Theme | Mode | Primary Color |
|-------|------|--------------|
| `light` | Light | Default |
| `dark` | Dark | Default |
| `zinc` | Dark | Zinc gray |
| `stone` | Light | Warm stone |
| `cyan` | Light | Cyan blue |
| `sky` | Light | Sky blue |
| `teal` | Light | Teal green |
| `gray` | Light | Cool gray |
| `neutral` | Light | Neutral |

### 12.2 Implementation (React Native)

```typescript
// ใช้ React Native Appearance API + AsyncStorage
import { useColorScheme } from 'react-native';

// เก็บ theme ใน Zustand store + AsyncStorage
// Apply ผ่าน ThemeProvider context
// ทุก component อ่าน theme จาก context
```

---

## 13. Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                   React Native App              │
│                                                 │
│  ┌───────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Screens  │  │  Zustand  │  │  SQLite /   │ │
│  │  (UI)     │←→│  Stores   │←→│  WatermelonDB│ │
│  └───────────┘  └──────────┘  └─────────────┘ │
│       │              │                          │
│       │         ┌────┴────┐                     │
│       │         │ Actions │                     │
│       │         └────┬────┘                     │
│       │              │                          │
│       ▼              ▼                          │
│  ┌──────────────────────┐                       │
│  │   StoreProvider      │  ← Initialize stores  │
│  │   (App root)         │     on app start      │
│  └──────────────────────┘                       │
│                                                 │
│  ┌──────────────────────┐                       │
│  │   API Layer          │                       │
│  │   (AI Analysis)      │──→ Gemini API         │
│  └──────────────────────┘                       │
│                                                 │
│  ┌──────────────────────┐                       │
│  │   AsyncStorage/MMKV  │  ← Settings, Theme    │
│  └──────────────────────┘                       │
└─────────────────────────────────────────────────┘
```

---

## 14. React Native Project Structure (แนะนำ)

```
mobile-ceas-flow/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx              # Root layout + providers
│   ├── (tabs)/                  # Tab navigator
│   │   ├── _layout.tsx          # Bottom tab config
│   │   ├── index.tsx            # Home (transactions)
│   │   ├── analytics.tsx        # Analytics
│   │   ├── ai-analysis.tsx      # AI Analysis
│   │   └── more.tsx             # Settings
│   ├── transaction/
│   │   ├── add.tsx              # Add transaction (modal)
│   │   └── [id].tsx             # Edit transaction (modal)
│   ├── settings/
│   │   ├── wallets.tsx          # จัดการกระเป๋าเงิน
│   │   ├── categories.tsx       # จัดการหมวดหมู่
│   │   ├── alerts.tsx           # ตั้งเป้าใช้จ่าย
│   │   ├── export.tsx           # ส่งออกข้อมูล
│   │   └── theme.tsx            # เปลี่ยนธีม
│   └── offline.tsx              # Offline fallback
│
├── components/                   # Reusable components
│   ├── ui/                      # Base UI (Button, Card, etc.)
│   ├── transaction/             # Transaction-related
│   ├── analytics/               # Charts & analytics
│   ├── common/                  # Shared (MonthPicker, etc.)
│   └── settings/                # Settings cards
│
├── lib/
│   ├── stores/                  # Zustand stores (reuse from web!)
│   │   ├── db.ts               # Database adapter (SQLite)
│   │   ├── transaction-store.ts
│   │   ├── wallet-store.ts
│   │   ├── category-store.ts
│   │   ├── analysis-store.ts
│   │   ├── ai-history-store.ts
│   │   ├── alert-settings-store.ts
│   │   ├── settings-store.ts
│   │   └── theme-store.ts
│   ├── utils/                   # Utilities (reuse from web!)
│   │   ├── format.ts           # Thai formatters
│   │   ├── export.ts           # Export (ปรับ for RN share)
│   │   └── import.ts           # Import (ปรับ for RN file picker)
│   ├── constants/
│   │   └── categories.ts       # Category presets (reuse!)
│   └── api/
│       └── ai.ts               # AI analysis API client
│
├── types/
│   └── index.ts                 # TypeScript interfaces (reuse!)
│
├── hooks/
│   └── useTabNavigation.ts      # (ถ้าจำเป็น)
│
├── assets/                       # Images, fonts
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

---

## 15. Migration Priority & Reusability

### Code ที่ Reuse ได้ทันที (ไม่ต้องแก้ / แก้น้อย)

| File/Module | Reuse Level | หมายเหตุ |
|-------------|-------------|----------|
| `types/index.ts` | 100% | ใช้ได้เลย |
| `lib/constants/categories.ts` | 100% | ใช้ได้เลย |
| `lib/utils/format.ts` | 95% | Intl API รองรับใน RN (Hermes) |
| `lib/stores/*-store.ts` (logic) | 80% | เปลี่ยน persistence layer |
| `lib/stores/settings-store.ts` | 90% | เปลี่ยน localStorage -> AsyncStorage |
| `lib/stores/theme-store.ts` | 70% | เปลี่ยนวิธี apply theme |
| Business logic (calculations) | 100% | Pure functions |
| AI prompt templates | 100% | ใช้ได้เลย |

### Code ที่ต้องเขียนใหม่

| Module | เหตุผล |
|--------|--------|
| UI Components ทั้งหมด | React Native ≠ HTML/CSS |
| Navigation | React Navigation แทน custom hook |
| Database layer (`db.ts`) | SQLite แทน Dexie/IndexedDB |
| Export/Import | ใช้ react-native-share + file system |
| Chart components | ใช้ react-native-chart-kit |
| Bottom Sheets | ใช้ @gorhom/bottom-sheet |
| Date/Time picker | ใช้ native picker |

---

## 16. Key Dependencies (React Native)

```json
{
  "dependencies": {
    "expo": "~52.x",
    "expo-router": "~4.x",
    "react-native": "0.76.x",
    "@react-navigation/bottom-tabs": "^7.x",
    "@react-navigation/native": "^7.x",

    "zustand": "^5.0",
    "expo-sqlite": "~15.x",

    "@gorhom/bottom-sheet": "^5.x",
    "react-native-reanimated": "~3.x",
    "react-native-gesture-handler": "~2.x",

    "react-native-chart-kit": "^6.x",
    "react-native-svg": "^15.x",

    "@react-native-async-storage/async-storage": "^2.x",
    "react-native-mmkv": "^3.x",

    "@react-native-community/datetimepicker": "^8.x",
    "react-native-share": "^11.x",

    "lucide-react-native": "^0.x",
    "nativewind": "^4.x",
    "tailwindcss": "^4.x",

    "@google/generative-ai": "^0.x",
    "xlsx": "^0.18.x"
  }
}
```

---

## 17. Migration Checklist

### Phase 1: Foundation
- [ ] สร้างโปรเจค Expo + Expo Router
- [ ] ตั้งค่า NativeWind (Tailwind for RN)
- [ ] Copy types, constants, format utilities
- [ ] ตั้งค่า SQLite database + migration
- [ ] Port Zustand stores (เปลี่ยน persistence layer)
- [ ] สร้าง UI component library พื้นฐาน

### Phase 2: Core Features
- [ ] Bottom Tab Navigation (4 tabs)
- [ ] HomeScreen + Transaction List (SectionList)
- [ ] Add/Edit Transaction (Bottom Sheet + Calculator)
- [ ] Category selector
- [ ] Wallet selector
- [ ] Month picker
- [ ] Summary bar

### Phase 3: Analytics & AI
- [ ] Charts (Pie/Bar) ด้วย react-native-chart-kit
- [ ] Wallet comparison view
- [ ] AI Analysis screen + API integration
- [ ] AI result display

### Phase 4: Settings & Polish
- [ ] Settings screens (all)
- [ ] Export/Import (Excel + Text)
- [ ] Theme system
- [ ] Budget alerts
- [ ] Frequent transactions
- [ ] App icon + splash screen

### Phase 5: Platform-Specific
- [ ] iOS: Haptic feedback, safe area
- [ ] Android: Material Design adaptations
- [ ] Push notifications (budget alerts)
- [ ] Widget (optional: daily summary)
- [ ] Biometric lock (optional)

---

## 18. Database Version History

| Version | Schema Changes |
|---------|---------------|
| V1 | Initial: transactions, categories, wallets |
| V2 | เพิ่ม `order` field ใน categories (สำหรับเรียงลำดับ) |
| V3 | เพิ่ม `icon` field ใน categories (ไอคอนกำหนดเอง) |
| V4 | เพิ่มตาราง `analysis` (ตรวจจับรายการซ้ำ) |
| V5 | เพิ่มตาราง `aiHistory` (เก็บผล AI) |
| V6 | เพิ่ม `notes[]` array ใน categories |

> **React Native:** เริ่มที่ V1 ใหม่ แต่ใช้ schema ล่าสุด (V6) เป็นฐาน

---

*Document generated from source code analysis of Mobile CEAS Flow (Next.js PWA)*
*สำหรับใช้เป็นแนวทางพัฒนา React Native version*
