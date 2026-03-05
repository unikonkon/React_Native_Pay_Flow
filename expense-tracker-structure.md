# 💰 Expense Tracker App — โครงสร้างการทำงาน React Native

> Stack: Expo SDK 54 · Expo Router v6 · expo-sqlite · Zustand · NativeWind v4 · TypeScript

---

## 1. Tech Stack ที่ใช้

| หมวด | Package | หมายเหตุ |
|------|---------|----------|
| Navigation | `expo-router ~6.0.23` + `@react-navigation/bottom-tabs` | File-based routing |
| Storage | `expo-sqlite ~16.0.10` | Local SQLite บนเครื่อง |
| State | `zustand ^5.0.11` | Global state ไม่ต้องมี backend |
| UI Styling | `nativewind ^4.2.2` + `tailwindcss` + `tailwind-merge` | Tailwind สำหรับ RN |
| List | `@shopify/flash-list ^2.2.2` | FlashList แทน FlatList ประสิทธิภาพดีกว่า |
| Chart | `react-native-chart-kit ^6.12.0` + `react-native-svg` | กราฟสรุปเงิน |
| Bottom Sheet | `@gorhom/bottom-sheet ^5.2.8` | Form เพิ่มรายการ |
| DateTime | `@react-native-community/datetimepicker` | เลือกวันที่ |
| Haptics | `expo-haptics ~15.0.8` | Feedback เมื่อบันทึก |
| Export | `expo-sharing` + `xlsx ^0.18.5` | ส่งออก Excel |
| ID | `uuid ^13.0.0` | สร้าง record ID |
| Async Storage | `@react-native-async-storage/async-storage` | เก็บ settings |

---

## 2. โครงสร้างโฟลเดอร์

```
my-app/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout + SQLite init + Zustand provider
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom Tab Navigator (3 tabs)
│   │   ├── index.tsx             # Tab 1: เพิ่ม/บันทึกรายรับรายจ่าย
│   │   ├── summary.tsx           # Tab 2: สรุปเงิน
│   │   └── settings.tsx          # Tab 3: ตั้งค่า
│   └── +not-found.tsx
│
├── components/
│   ├── transaction/
│   │   ├── TransactionForm.tsx   # Form กรอกรายการ (Bottom Sheet)
│   │   ├── TransactionItem.tsx   # รายการแต่ละแถว
│   │   ├── TransactionList.tsx   # FlashList แสดงรายการ
│   │   └── CategoryPicker.tsx    # เลือกหมวดหมู่
│   ├── summary/
│   │   ├── BalanceCard.tsx       # การ์ดแสดงยอดคงเหลือ
│   │   ├── PieChartView.tsx      # กราฟวงกลมแยกหมวด
│   │   └── BarChartView.tsx      # กราฟแท่งรายเดือน
│   └── ui/
│       ├── FAB.tsx               # ปุ่ม + ลอยอยู่ด้านล่าง
│       ├── AmountInput.tsx       # Input กรอกจำนวนเงิน
│       └── EmptyState.tsx        # แสดงเมื่อไม่มีข้อมูล
│
├── db/
│   ├── schema.ts                 # นิยาม table structure
│   ├── migrations.ts             # SQL migration scripts
│   └── queries/
│       ├── transactions.ts       # CRUD transactions
│       └── categories.ts         # CRUD categories
│
├── stores/
│   ├── transactionStore.ts       # Zustand: รายการธุรกรรม
│   ├── categoryStore.ts          # Zustand: หมวดหมู่
│   └── settingsStore.ts          # Zustand: ตั้งค่าแอป
│
├── hooks/
│   ├── useDatabase.ts            # init SQLite + expose db instance
│   ├── useTransactions.ts        # query + mutate transactions
│   └── useSummary.ts             # คำนวณยอดสรุป
│
├── types/
│   └── index.ts                  # TypeScript interfaces
│
├── constants/
│   ├── categories.ts             # หมวดหมู่เริ่มต้น + icon
│   └── theme.ts                  # สีและ font
│
└── utils/
    ├── currency.ts               # format ตัวเลขเงิน
    ├── date.ts                   # format วันที่ภาษาไทย
    └── export.ts                 # สร้างไฟล์ Excel
```

---

## 3. Database Schema (expo-sqlite)

```sql
-- หมวดหมู่
CREATE TABLE categories (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  icon      TEXT NOT NULL,
  color     TEXT NOT NULL,
  type      TEXT NOT NULL CHECK(type IN ('income','expense')),
  is_custom INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- รายการรายรับ-รายจ่าย
CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK(type IN ('income','expense')),
  amount      REAL NOT NULL,
  category_id TEXT NOT NULL,
  note        TEXT,
  date        TEXT NOT NULL,           -- ISO 8601: 2025-03-05
  created_at  TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

---

## 4. TypeScript Types

```typescript
// types/index.ts

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;         // @expo/vector-icons name
  color: string;        // hex color
  type: TransactionType;
  isCustom: boolean;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  category?: Category;  // joined
  note?: string;
  date: string;         // YYYY-MM-DD
  createdAt: string;
}

export interface MonthlySummary {
  month: string;        // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface Settings {
  currency: string;     // 'THB'
  dateFormat: string;
  defaultTab: number;
  theme: 'light' | 'dark' | 'system';
}
```

---

## 5. Zustand Store

```typescript
// stores/transactionStore.ts
interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;

  loadTransactions: (month?: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}
```

---

## 6. โครงสร้างแต่ละหน้า

### Tab 1 — เพิ่ม / บันทึกรายรับรายจ่าย (`index.tsx`)

```
┌─────────────────────────────────┐
│  [เดือนปัจจุบัน ◀ ▶]            │  ← สลับเดือน
│  รายรับ ฿12,500  รายจ่าย ฿8,200 │  ← ยอดสรุปด่วน
├─────────────────────────────────┤
│  [วันที่]  [หมวดหมู่]  [จำนวน]  │
│  05 มี.ค.  🍔 อาหาร    ฿120     │  ← TransactionItem
│  04 มี.ค.  💼 เงินเดือน ฿25,000 │
│  ...                            │
├─────────────────────────────────┤
│                          [＋]   │  ← FAB เปิด BottomSheet
└─────────────────────────────────┘

BottomSheet (TransactionForm):
  - Toggle: รายรับ / รายจ่าย
  - AmountInput (ใหญ่ กด numpad ง่าย)
  - CategoryPicker (grid icon)
  - DatePicker
  - Note (optional)
  - ปุ่มบันทึก + expo-haptics feedback
```

**Flow การเพิ่มรายการ:**
1. กด FAB → `@gorhom/bottom-sheet` เปิดขึ้น
2. เลือก type (income/expense) → UI เปลี่ยนสี
3. กรอก amount → custom numpad
4. เลือก category → CategoryPicker
5. เลือกวันที่ → `@react-native-community/datetimepicker`
6. กด "บันทึก" → `transactionStore.addTransaction()` → SQLite → Haptic feedback → ปิด sheet → refresh list

---

### Tab 2 — สรุปเงิน (`summary.tsx`)

```
┌─────────────────────────────────┐
│  [ปี 2025]  [เดือน ▼]           │  ← filter
│  ┌─────────────────────────┐    │
│  │  คงเหลือ  ฿4,300        │    │  ← BalanceCard
│  │  รายรับ ↑  รายจ่าย ↓   │    │
│  └─────────────────────────┘    │
│                                 │
│  [รายรับ/รายจ่าย]  [รายหมวด]   │  ← Tab switch
│                                 │
│  BarChart: รายเดือน             │  ← react-native-chart-kit
│  หรือ                           │
│  PieChart: แยกหมวดหมู่          │
│                                 │
│  📊 Top 5 หมวดรายจ่าย          │
│  🍔 อาหาร      ฿3,200  40%     │
│  🚗 เดินทาง    ฿1,500  18%     │
│  ...                            │
│                                 │
│  [ส่งออก Excel]                 │  ← expo-sharing + xlsx
└─────────────────────────────────┘
```

**Logic สรุป (`useSummary.ts`):**
```typescript
// คำนวณจาก SQLite query
SELECT
  category_id,
  SUM(amount) as total,
  COUNT(*) as count
FROM transactions
WHERE type = 'expense'
  AND strftime('%Y-%m', date) = ?
GROUP BY category_id
ORDER BY total DESC
```

---

### Tab 3 — ตั้งค่า (`settings.tsx`)

```
┌─────────────────────────────────┐
│  ⚙️ ตั้งค่า                     │
├─────────────────────────────────┤
│  🎨 ธีม           Light / Dark  │
│  💱 สกุลเงิน      THB ฿         │
│  📅 รูปแบบวันที่  DD/MM/YYYY    │
├─────────────────────────────────┤
│  📂 หมวดหมู่      จัดการ →      │
├─────────────────────────────────┤
│  💾 ข้อมูล                      │
│  ├ ส่งออก Excel                 │
│  ├ นำเข้าข้อมูล                 │
│  └ ล้างข้อมูลทั้งหมด            │
├─────────────────────────────────┤
│  ℹ️ เวอร์ชัน 1.0.0              │
└─────────────────────────────────┘
```

**Settings เก็บใน `@react-native-async-storage/async-storage`**

---

## 7. Navigation Structure

```typescript
// app/(tabs)/_layout.tsx
<Tabs screenOptions={{ tabBarStyle: { ... } }}>
  <Tabs.Screen
    name="index"
    options={{
      title: "รายการ",
      tabBarIcon: ({ color }) => (
        <Ionicons name="list" color={color} />
      )
    }}
  />
  <Tabs.Screen
    name="summary"
    options={{
      title: "สรุป",
      tabBarIcon: ({ color }) => (
        <Ionicons name="bar-chart" color={color} />
      )
    }}
  />
  <Tabs.Screen
    name="settings"
    options={{
      title: "ตั้งค่า",
      tabBarIcon: ({ color }) => (
        <Ionicons name="settings" color={color} />
      )
    }}
  />
</Tabs>
```

---

## 8. การ Init Database (`app/_layout.tsx`)

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const { initDB } = useDatabase();

  useEffect(() => {
    initDB(); // สร้าง table + seed categories เริ่มต้น
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

---

## 9. หมวดหมู่เริ่มต้น

### รายจ่าย (Expense)
| Icon | หมวดหมู่ | สี |
|------|----------|-----|
| 🍔 | อาหาร-เครื่องดื่ม | #FF6B6B |
| 🚗 | เดินทาง | #4ECDC4 |
| 🏠 | ที่พัก | #45B7D1 |
| 💊 | สุขภาพ | #96CEB4 |
| 🎮 | บันเทิง | #FFEAA7 |
| 👕 | เสื้อผ้า | #DDA0DD |
| 📚 | การศึกษา | #98D8C8 |
| 🔧 | อื่น ๆ | #B0B0B0 |

### รายรับ (Income)
| Icon | หมวดหมู่ | สี |
|------|----------|-----|
| 💼 | เงินเดือน | #2ECC71 |
| 💰 | รายได้พิเศษ | #27AE60 |
| 🎁 | รับของขวัญ | #F39C12 |
| 📈 | ลงทุน | #16A085 |

---

## 10. Export Excel Flow

```typescript
// utils/export.ts
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportToExcel(transactions: Transaction[]) {
  const ws = XLSX.utils.json_to_sheet(
    transactions.map(t => ({
      วันที่: t.date,
      ประเภท: t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      หมวดหมู่: t.category?.name,
      จำนวนเงิน: t.amount,
      หมายเหตุ: t.note || '',
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายการ');

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const path = `${FileSystem.documentDirectory}expense_${Date.now()}.xlsx`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(path);
}
```

---

## 11. Performance Considerations

| ปัญหา | วิธีแก้ |
|-------|---------|
| List ยาว lag | `@shopify/flash-list` แทน FlatList |
| Query ช้า | Index บน `date`, `type`, `category_id` |
| Re-render ถี่ | Zustand slice แยก store ชัดเจน |
| Chart render | `useMemo` คำนวณ data ก่อนส่ง chart |
| SQLite blocking | ใช้ async/await ทุก query |

---

## 12. ลำดับการพัฒนา (Suggested Sprint)

```
Sprint 1 — Core
  ✅ Setup Expo Router + NativeWind
  ✅ init expo-sqlite + schema
  ✅ Tab navigation 3 tabs
  ✅ TransactionForm (BottomSheet)
  ✅ TransactionList (FlashList)
  ✅ CRUD transactions

Sprint 2 — Summary
  ✅ BalanceCard
  ✅ BarChart รายเดือน
  ✅ PieChart หมวดหมู่
  ✅ filter เดือน/ปี

Sprint 3 — Settings & Polish
  ✅ Settings page
  ✅ จัดการหมวดหมู่ custom
  ✅ Export Excel
  ✅ Dark mode
  ✅ Haptic feedback + animation
```
