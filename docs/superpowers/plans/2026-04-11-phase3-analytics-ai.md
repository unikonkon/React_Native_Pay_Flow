# Phase 3: Analytics & AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add wallet comparison analytics, historical bar chart data, AI financial analysis via Google Gemini, and AI history management.

**Architecture:** DB-first — add monthly summary query and AI history queries, then build stores, then API client, then UI components and screens. API key stored via expo-secure-store, Gemini called via @google/generative-ai SDK.

**Tech Stack:** React Native + Expo, TypeScript, Zustand, expo-sqlite, @google/generative-ai, expo-secure-store, NativeWind

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `lib/api/ai.ts` | Gemini API key management (secure-store) + API client |
| `lib/stores/ai-history-store.ts` | AI history Zustand store |
| `components/ai/AiResultView.tsx` | Render structured/full AI analysis results |
| `components/analytics/WalletsContent.tsx` | Wallet comparison bars for analytics tab |

### Modified files
| File | Changes |
|------|---------|
| `lib/stores/db.ts` | AI history queries + getMonthlySummaries query |
| `app/(tabs)/analytics.tsx` | Wallet filter, wallet tab, historical bar chart |
| `app/(tabs)/ai-analysis.tsx` | Full AI analysis UI (replace placeholder) |
| `app/(tabs)/more.tsx` | API key settings row |
| `app/_layout.tsx` | Load AI history store on boot |

---

### Task 1: Install @google/generative-ai dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
cd "/Users/macbook3lf1/web work/React_Native_Pay_Flow"
npx expo install @google/generative-ai
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @google/generative-ai SDK"
```

---

### Task 2: Add DB queries — getMonthlySummaries + AI history

**Files:**
- Modify: `lib/stores/db.ts`

- [ ] **Step 1: Add `getMonthlySummaries` query**

Add after the existing category queries section, before the wallet queries:

```typescript
// ===== Monthly Summary Queries =====

export async function getMonthlySummaries(
  db: SQLiteDatabase,
  months: string[],
  walletId?: string
): Promise<{ month: string; income: number; expense: number }[]> {
  const placeholders = months.map(() => '?').join(',');
  const params: (string | number)[] = [...months];
  let walletFilter = '';
  if (walletId) {
    walletFilter = ' AND wallet_id = ?';
    params.push(walletId);
  }

  const rows = await db.getAllAsync<{
    month: string; type: string; total: number;
  }>(
    `SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total
     FROM transactions
     WHERE strftime('%Y-%m', date) IN (${placeholders})${walletFilter}
     GROUP BY month, type`,
    params
  );

  return months.map(m => {
    const incomeRow = rows.find(r => r.month === m && r.type === 'income');
    const expenseRow = rows.find(r => r.month === m && r.type === 'expense');
    return {
      month: m,
      income: incomeRow?.total ?? 0,
      expense: expenseRow?.total ?? 0,
    };
  });
}

export async function getTransactionsByYear(
  db: SQLiteDatabase,
  year: number,
  walletId?: string
): Promise<Transaction[]> {
  const yearStr = String(year);
  let walletFilter = '';
  const params: string[] = [yearStr];
  if (walletId) {
    walletFilter = ' AND t.wallet_id = ?';
    params.push(walletId);
  }

  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; wallet_id: string;
    note: string | null; date: string; created_at: string;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
    cat_is_custom: number; cat_sort_order: number;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
            c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE strftime('%Y', t.date) = ?${walletFilter}
     ORDER BY t.date DESC`,
    params
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
  }));
}
```

- [ ] **Step 2: Replace AI history stubs with real queries**

Add `AiHistory` and `AiPromptType` to the import at top of db.ts:

```typescript
import type { AiHistory, AiPromptType, Analysis, Category, MatchType, Transaction, TransactionType, Wallet, WalletType } from '@/types';
```

Replace the AI History stubs section with:

```typescript
// ===== AI History Queries =====

export async function getAllAiHistory(db: SQLiteDatabase): Promise<AiHistory[]> {
  const rows = await db.getAllAsync<{
    id: string; wallet_id: string | null; prompt_type: string;
    year: number; response_type: string; response_data: string;
    created_at: string;
  }>('SELECT * FROM ai_history ORDER BY created_at DESC');

  return rows.map(r => ({
    id: r.id,
    walletId: r.wallet_id,
    promptType: r.prompt_type as AiPromptType,
    year: r.year,
    responseType: r.response_type as 'structured' | 'full' | 'text',
    responseData: r.response_data,
    createdAt: r.created_at,
  }));
}

export async function insertAiHistory(
  db: SQLiteDatabase,
  data: { walletId: string | null; promptType: AiPromptType; year: number; responseType: string; responseData: string }
): Promise<string> {
  const id = generateId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO ai_history (id, wallet_id, prompt_type, year, response_type, response_data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.walletId, data.promptType, data.year, data.responseType, data.responseData, createdAt]
  );
  return id;
}

export async function deleteAiHistory(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM ai_history WHERE id = ?', [id]);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/stores/db.ts
git commit -m "feat: add getMonthlySummaries, getTransactionsByYear, AI history queries"
```

---

### Task 3: Create AI API client (`lib/api/ai.ts`)

**Files:**
- Create: `lib/api/ai.ts`

- [ ] **Step 1: Create `lib/api/ai.ts`**

```typescript
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

const API_KEY_STORE = 'gemini_api_key';

// ===== API Key Management =====

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_STORE);
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORE, key);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORE);
}

// ===== Prompt Builder =====

function buildTransactionSummary(transactions: Transaction[]): string {
  const income = transactions.filter(t => t.type === 'income');
  const expense = transactions.filter(t => t.type === 'expense');

  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expense.reduce((s, t) => s + t.amount, 0);

  // Group by category
  const categoryMap = new Map<string, { name: string; type: string; total: number; count: number }>();
  for (const tx of transactions) {
    const key = tx.categoryId;
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      categoryMap.set(key, {
        name: tx.category?.name ?? 'อื่นๆ',
        type: tx.type,
        total: tx.amount,
        count: 1,
      });
    }
  }

  const categoryLines = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .map(c => `- ${c.name} (${c.type === 'income' ? 'รายรับ' : 'รายจ่าย'}): ${formatCurrency(c.total)} (${c.count} รายการ)`)
    .join('\n');

  // Group by month
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    const month = tx.date.substring(0, 7);
    const existing = monthMap.get(month) ?? { income: 0, expense: 0 };
    if (tx.type === 'income') existing.income += tx.amount;
    else existing.expense += tx.amount;
    monthMap.set(month, existing);
  }

  const monthLines = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => `- ${m}: รายรับ ${formatCurrency(v.income)}, รายจ่าย ${formatCurrency(v.expense)}`)
    .join('\n');

  return `ข้อมูลการเงิน:
- รายรับรวม: ${formatCurrency(totalIncome)}
- รายจ่ายรวม: ${formatCurrency(totalExpense)}
- คงเหลือ: ${formatCurrency(totalIncome - totalExpense)}
- จำนวนรายการ: ${transactions.length} รายการ

สรุปรายเดือน:
${monthLines}

สรุปตามหมวดหมู่:
${categoryLines}`;
}

function buildStructuredPrompt(summary: string): string {
  return `คุณเป็นที่ปรึกษาการเงินส่วนบุคคล วิเคราะห์ข้อมูลการเงินต่อไปนี้แล้วตอบเป็น JSON ตามรูปแบบที่กำหนด (ภาษาไทย)

${summary}

ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block) ตามรูปแบบนี้:
{
  "summary": {
    "healthScore": "เกรดสุขภาพการเงิน (A+, A, A-, B+, B, B-, C+, C, C-, D, F)",
    "totalIncome": ตัวเลขรายรับรวม,
    "totalExpense": ตัวเลขรายจ่ายรวม,
    "savingRate": ตัวเลขอัตราการออมเป็นเปอร์เซ็นต์,
    "rule503020": {
      "needs": ตัวเลขเปอร์เซ็นต์ความจำเป็น,
      "wants": ตัวเลขเปอร์เซ็นต์ความต้องการ,
      "savings": ตัวเลขเปอร์เซ็นต์ออม
    }
  },
  "recommendations": {
    "monthlySaving": ตัวเลขเป้าออมรายเดือน,
    "monthlyInvestment": ตัวเลขเป้าลงทุนรายเดือน,
    "emergencyFundTarget": ตัวเลขเป้ากองทุนฉุกเฉิน,
    "investmentTypes": ["ประเภทลงทุน1", "ประเภทลงทุน2"]
  },
  "expensesToReduce": [
    {"category": "ชื่อหมวด", "amount": ตัวเลข, "percent": ตัวเลข, "targetReduction": ตัวเลขเปอร์เซ็นต์ที่ควรลด}
  ],
  "needExtraIncome": {
    "required": true/false,
    "suggestedAmount": ตัวเลข,
    "reason": "เหตุผล"
  },
  "actionPlan": ["แผน1", "แผน2", "แผน3"],
  "warnings": ["คำเตือน1", "คำเตือน2"]
}`;
}

function buildFullPrompt(summary: string): string {
  return `คุณเป็นที่ปรึกษาการเงินส่วนบุคคล วิเคราะห์ข้อมูลการเงินต่อไปนี้อย่างละเอียด ตอบเป็นภาษาไทย ใช้ format ที่อ่านง่าย

${summary}

กรุณาวิเคราะห์ครอบคลุม:
1. สรุปสถานะการเงินโดยรวม (เกรดสุขภาพการเงิน)
2. วิเคราะห์ตามกฎ 50/30/20
3. หมวดที่ใช้จ่ายมากเกินไป + ข้อเสนอแนะลด
4. เป้าหมายการออมและลงทุน
5. แผนปฏิบัติ 3-5 ข้อ
6. คำเตือนหรือข้อควรระวัง`;
}

// ===== API Call =====

export async function analyzeFinances(data: {
  year: number;
  walletId: string | null;
  promptType: 'structured' | 'full';
  transactions: Transaction[];
}): Promise<{ success: boolean; responseType: 'structured' | 'full' | 'text'; result: string }> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('ยังไม่ได้ตั้งค่า API Key กรุณาตั้งค่าในหน้าตั้งค่า');
  }

  const summary = buildTransactionSummary(data.transactions);
  const prompt = data.promptType === 'structured'
    ? buildStructuredPrompt(summary)
    : buildFullPrompt(summary);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (data.promptType === 'structured') {
    // Try to parse JSON from response
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      JSON.parse(cleaned); // validate it's valid JSON
      return { success: true, responseType: 'structured', result: cleaned };
    } catch {
      // If JSON parsing fails, return as text
      return { success: true, responseType: 'text', result: text };
    }
  }

  return { success: true, responseType: 'full', result: text };
}
```

- [ ] **Step 2: Remove .gitkeep from lib/api/**

```bash
rm -f lib/api/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add lib/api/ai.ts
git commit -m "feat: create AI API client with Gemini SDK + secure key storage"
```

---

### Task 4: Create AI history store

**Files:**
- Create: `lib/stores/ai-history-store.ts`

- [ ] **Step 1: Create `lib/stores/ai-history-store.ts`**

```typescript
import { create } from 'zustand';
import type { AiHistory, AiPromptType } from '@/types';
import { getDb, getAllAiHistory, insertAiHistory, deleteAiHistory } from '@/lib/stores/db';

interface AiHistoryStore {
  histories: AiHistory[];
  isLoading: boolean;

  loadHistories: () => Promise<void>;
  addHistory: (data: {
    walletId: string | null;
    promptType: AiPromptType;
    year: number;
    responseType: 'structured' | 'full' | 'text';
    responseData: string;
  }) => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
}

export const useAiHistoryStore = create<AiHistoryStore>((set, get) => ({
  histories: [],
  isLoading: false,

  loadHistories: async () => {
    set({ isLoading: true });
    const db = getDb();
    const histories = await getAllAiHistory(db);
    set({ histories, isLoading: false });
  },

  addHistory: async (data) => {
    const db = getDb();
    await insertAiHistory(db, data);
    await get().loadHistories();
  },

  deleteHistory: async (id) => {
    const db = getDb();
    await deleteAiHistory(db, id);
    await get().loadHistories();
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/ai-history-store.ts
git commit -m "feat: create AI history Zustand store"
```

---

### Task 5: Update app/_layout.tsx to load AI history

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add AI history store import and load call**

Add import:
```typescript
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
```

In `RootLayout()`, add:
```typescript
const loadAiHistories = useAiHistoryStore(s => s.loadHistories);
```

Update the useEffect to also call `loadAiHistories()` and add it to the dependency array.

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: load AI history store on app boot"
```

---

### Task 6: Create AiResultView component

**Files:**
- Create: `components/ai/AiResultView.tsx`

- [ ] **Step 1: Create `components/ai/AiResultView.tsx`**

```typescript
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StructuredResult } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

interface AiResultViewProps {
  responseType: 'structured' | 'full' | 'text';
  responseData: string;
}

export function AiResultView({ responseType, responseData }: AiResultViewProps) {
  if (responseType === 'structured') {
    try {
      const data: StructuredResult = JSON.parse(responseData);
      return <StructuredView data={data} />;
    } catch {
      return <TextView text={responseData} />;
    }
  }

  return <TextView text={responseData} />;
}

function StructuredView({ data }: { data: StructuredResult }) {
  return (
    <View className="gap-4">
      {/* Health Score Card */}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <View className="flex-row items-center mb-3">
          <Ionicons name="heart-outline" size={20} color="#0891b2" />
          <Text className="text-foreground font-bold text-base ml-2">สุขภาพการเงิน</Text>
        </View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted-foreground">เกรด</Text>
          <Text className="text-primary text-2xl font-bold">{data.summary.healthScore}</Text>
        </View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted-foreground">อัตราการออม</Text>
          <Text className="text-foreground font-semibold">{formatPercentage(data.summary.savingRate)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <View>
            <Text className="text-muted-foreground text-xs">รายรับ</Text>
            <Text className="text-income font-bold">{formatCurrency(data.summary.totalIncome)}</Text>
          </View>
          <View>
            <Text className="text-muted-foreground text-xs">รายจ่าย</Text>
            <Text className="text-expense font-bold">{formatCurrency(data.summary.totalExpense)}</Text>
          </View>
        </View>
        <View className="bg-secondary rounded-xl p-3 mt-2">
          <Text className="text-muted-foreground text-xs mb-1">กฎ 50/30/20</Text>
          <View className="flex-row justify-between">
            <Text className="text-foreground text-sm">จำเป็น {formatPercentage(data.summary.rule503020.needs)}</Text>
            <Text className="text-foreground text-sm">ต้องการ {formatPercentage(data.summary.rule503020.wants)}</Text>
            <Text className="text-foreground text-sm">ออม {formatPercentage(data.summary.rule503020.savings)}</Text>
          </View>
        </View>
      </View>

      {/* Recommendations Card */}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <View className="flex-row items-center mb-3">
          <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
          <Text className="text-foreground font-bold text-base ml-2">คำแนะนำ</Text>
        </View>
        <InfoRow label="ออมรายเดือน" value={formatCurrency(data.recommendations.monthlySaving)} />
        <InfoRow label="ลงทุนรายเดือน" value={formatCurrency(data.recommendations.monthlyInvestment)} />
        <InfoRow label="กองทุนฉุกเฉิน" value={formatCurrency(data.recommendations.emergencyFundTarget)} />
        {data.recommendations.investmentTypes.length > 0 && (
          <View className="mt-2">
            <Text className="text-muted-foreground text-xs mb-1">ประเภทลงทุนแนะนำ</Text>
            {data.recommendations.investmentTypes.map((t, i) => (
              <Text key={i} className="text-foreground text-sm">• {t}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Expenses to Reduce */}
      {data.expensesToReduce.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View className="flex-row items-center mb-3">
            <Ionicons name="trending-down-outline" size={20} color="#EF4444" />
            <Text className="text-foreground font-bold text-base ml-2">หมวดที่ควรลด</Text>
          </View>
          {data.expensesToReduce.map((item, i) => (
            <View key={i} className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0">
              <Text className="text-foreground flex-1">{item.category}</Text>
              <Text className="text-expense font-semibold mr-2">{formatCurrency(item.amount)}</Text>
              <Text className="text-muted-foreground text-sm">ลด {formatPercentage(item.targetReduction)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Plan */}
      {data.actionPlan.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkbox-outline" size={20} color="#22C55E" />
            <Text className="text-foreground font-bold text-base ml-2">แผนปฏิบัติ</Text>
          </View>
          {data.actionPlan.map((plan, i) => (
            <Text key={i} className="text-foreground text-sm mb-1">
              {i + 1}. {plan}
            </Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <View className="bg-expense/10 rounded-2xl p-4 border border-expense/30">
          <View className="flex-row items-center mb-3">
            <Ionicons name="warning-outline" size={20} color="#EF4444" />
            <Text className="text-expense font-bold text-base ml-2">คำเตือน</Text>
          </View>
          {data.warnings.map((w, i) => (
            <Text key={i} className="text-foreground text-sm mb-1">⚠️ {w}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-foreground font-semibold text-sm">{value}</Text>
    </View>
  );
}

function TextView({ text }: { text: string }) {
  return (
    <View className="bg-card rounded-2xl p-4 border border-border">
      <Text className="text-foreground text-sm leading-6">{text}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Remove .gitkeep from components/ai/**

```bash
rm -f components/ai/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add components/ai/AiResultView.tsx
git commit -m "feat: create AiResultView component with structured/text display"
```

---

### Task 7: Create WalletsContent component

**Files:**
- Create: `components/analytics/WalletsContent.tsx`

- [ ] **Step 1: Create `components/analytics/WalletsContent.tsx`**

```typescript
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction, Wallet } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface WalletsContentProps {
  wallets: Wallet[];
  transactions: Transaction[];
}

export function WalletsContent({ wallets, transactions }: WalletsContentProps) {
  if (wallets.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-muted-foreground">ไม่มีกระเป๋าเงิน</Text>
      </View>
    );
  }

  // Calculate balance per wallet for the current month's transactions
  const walletStats = wallets.map(wallet => {
    const walletTxs = transactions.filter(t => t.walletId === wallet.id);
    const income = walletTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = walletTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { wallet, income, expense, balance: income - expense };
  });

  const maxBalance = Math.max(...walletStats.map(w => Math.abs(w.balance)), 1);

  return (
    <View className="px-4 mb-4">
      <Text className="text-foreground font-bold text-base mb-3">เปรียบเทียบกระเป๋าเงิน</Text>
      {walletStats.map(({ wallet, income, expense, balance }) => {
        const barWidth = Math.max((Math.abs(balance) / maxBalance) * 100, 5);
        return (
          <View key={wallet.id} className="mb-4">
            <View className="flex-row items-center mb-1">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: wallet.color }}
              >
                <Ionicons name={wallet.icon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
              </View>
              <Text className="text-foreground font-medium flex-1">{wallet.name}</Text>
              <Text className={`font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(Math.abs(balance))}
              </Text>
            </View>
            <View className="h-3 bg-secondary rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${balance >= 0 ? 'bg-income' : 'bg-expense'}`}
                style={{ width: `${barWidth}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-income text-xs">+{formatCurrency(income)}</Text>
              <Text className="text-expense text-xs">-{formatCurrency(expense)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/analytics/WalletsContent.tsx
git commit -m "feat: create WalletsContent wallet comparison component"
```

---

### Task 8: Update analytics screen with wallet filter + wallet tab + historical bar chart

**Files:**
- Modify: `app/(tabs)/analytics.tsx`

- [ ] **Step 1: Rewrite analytics.tsx**

Replace entire file:

```typescript
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useSummary } from '@/hooks/useSummary';
import { BalanceCard } from '@/components/analytics/BalanceCard';
import { PieChartView } from '@/components/analytics/PieChartView';
import { BarChartView } from '@/components/analytics/BarChartView';
import { WalletsContent } from '@/components/analytics/WalletsContent';
import { formatMonthYearThai, shiftMonth } from '@/lib/utils/format';
import { getAllTransactions, getDb, getMonthlySummaries } from '@/lib/stores/db';
import { exportToCSV } from '@/lib/utils/export';

type ChartTab = 'overview' | 'category' | 'wallets';

export default function AnalyticsScreen() {
  const { transactions, currentMonth, setCurrentMonth, loadTransactions } = useTransactionStore();
  const wallets = useWalletStore(s => s.wallets);
  const [chartTab, setChartTab] = useState<ChartTab>('overview');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [walletFilterOpen, setWalletFilterOpen] = useState(false);

  // Filter transactions by selected wallet
  const filteredTransactions = useMemo(() => {
    if (!selectedWalletId) return transactions;
    return transactions.filter(t => t.walletId === selectedWalletId);
  }, [transactions, selectedWalletId]);

  const { totalIncome, totalExpense, balance, expenseByCategory } = useSummary(filteredTransactions);

  useEffect(() => {
    loadTransactions(currentMonth);
  }, [currentMonth, loadTransactions]);

  const handlePrevMonth = () => setCurrentMonth(shiftMonth(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(shiftMonth(currentMonth, 1));

  // Historical bar chart data
  const [barData, setBarData] = useState<{ labels: string[]; incomeData: number[]; expenseData: number[] }>({
    labels: [], incomeData: [], expenseData: [],
  });

  useEffect(() => {
    const fetchBarData = async () => {
      const months: string[] = [];
      const labels: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = shiftMonth(currentMonth, -i);
        months.push(m);
        labels.push(m.split('-')[1]);
      }
      try {
        const db = getDb();
        const summaries = await getMonthlySummaries(db, months, selectedWalletId ?? undefined);
        setBarData({
          labels,
          incomeData: summaries.map(s => s.income),
          expenseData: summaries.map(s => s.expense),
        });
      } catch {
        setBarData({ labels, incomeData: labels.map(() => 0), expenseData: labels.map(() => 0) });
      }
    };
    fetchBarData();
  }, [currentMonth, selectedWalletId]);

  const handleExport = async () => {
    try {
      const db = getDb();
      const allTx = await getAllTransactions(db);
      await exportToCSV(allTx);
    } catch {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  const selectedWalletName = selectedWalletId
    ? wallets.find(w => w.id === selectedWalletId)?.name ?? 'กระเป๋า'
    : 'ทุกกระเป๋า';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView>
        {/* Month Selector */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
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

        {/* Wallet Filter */}
        <View className="px-4 pb-3">
          <Pressable
            onPress={() => setWalletFilterOpen(!walletFilterOpen)}
            className="flex-row items-center px-3 py-2 bg-secondary rounded-lg self-start"
          >
            <Ionicons name="wallet-outline" size={16} color="#666" />
            <Text className="text-foreground text-sm ml-1">{selectedWalletName}</Text>
            <Ionicons name="chevron-down" size={14} color="#666" style={{ marginLeft: 4 }} />
          </Pressable>
          {walletFilterOpen && (
            <View className="mt-2 bg-card rounded-xl border border-border overflow-hidden">
              <Pressable
                onPress={() => { setSelectedWalletId(null); setWalletFilterOpen(false); }}
                className={`px-4 py-3 border-b border-border ${!selectedWalletId ? 'bg-primary/10' : ''}`}
              >
                <Text className={`${!selectedWalletId ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  ทุกกระเป๋า
                </Text>
              </Pressable>
              {wallets.map(w => (
                <Pressable
                  key={w.id}
                  onPress={() => { setSelectedWalletId(w.id); setWalletFilterOpen(false); }}
                  className={`flex-row items-center px-4 py-3 border-b border-border ${selectedWalletId === w.id ? 'bg-primary/10' : ''}`}
                >
                  <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: w.color }}>
                    <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={12} color="white" />
                  </View>
                  <Text className={`${selectedWalletId === w.id ? 'text-primary font-semibold' : 'text-foreground'}`}>
                    {w.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Balance Card */}
        <BalanceCard totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} />

        {/* Chart Tab Switch */}
        <View className="flex-row mx-4 mb-4 rounded-xl overflow-hidden border border-border">
          {(['overview', 'category', 'wallets'] as ChartTab[]).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setChartTab(tab)}
              className={`flex-1 py-2.5 items-center ${chartTab === tab ? 'bg-primary' : 'bg-card'}`}
            >
              <Text className={`font-semibold text-xs ${chartTab === tab ? 'text-primary-foreground' : 'text-foreground'}`}>
                {tab === 'overview' ? 'รายรับ/รายจ่าย' : tab === 'category' ? 'รายหมวด' : 'กระเป๋า'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Charts */}
        {chartTab === 'overview' && (
          <BarChartView labels={barData.labels} incomeData={barData.incomeData} expenseData={barData.expenseData} />
        )}
        {chartTab === 'category' && (
          <PieChartView data={expenseByCategory} title="สัดส่วนรายจ่ายตามหมวดหมู่" />
        )}
        {chartTab === 'wallets' && (
          <WalletsContent wallets={wallets} transactions={transactions} />
        )}

        {/* Export Button */}
        <Pressable
          onPress={handleExport}
          className="flex-row items-center justify-center mx-4 my-6 py-3 bg-secondary rounded-xl border border-border"
        >
          <Ionicons name="download-outline" size={20} color="#666" />
          <Text className="text-foreground font-semibold ml-2">ส่งออก Excel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/analytics.tsx"
git commit -m "feat: add wallet filter, wallet tab, historical bar chart to analytics"
```

---

### Task 9: Build AI Analysis screen

**Files:**
- Modify: `app/(tabs)/ai-analysis.tsx`

- [ ] **Step 1: Rewrite ai-analysis.tsx**

Replace entire file:

```typescript
import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { AiResultView } from '@/components/ai/AiResultView';
import { getDb, getTransactionsByYear } from '@/lib/stores/db';
import { analyzeFinances, getApiKey } from '@/lib/api/ai';
import { formatMonthYearThai } from '@/lib/utils/format';
import type { AiHistory } from '@/types';

type PromptType = 'structured' | 'full';

export default function AiAnalysisScreen() {
  const wallets = useWalletStore(s => s.wallets);
  const { histories, addHistory, deleteHistory, loadHistories } = useAiHistoryStore();

  const currentYear = new Date().getFullYear() + 543; // Buddhist era
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<PromptType>('structured');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [currentResult, setCurrentResult] = useState<{ type: string; data: string } | null>(null);

  // Check API key on mount
  useState(() => {
    getApiKey().then(key => setHasApiKey(!!key));
  });

  const gregorianYear = selectedYear - 543;

  const handleAnalyze = useCallback(async () => {
    const key = await getApiKey();
    if (!key) {
      Alert.alert('ยังไม่ได้ตั้งค่า', 'กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อน');
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const db = getDb();
      const transactions = await getTransactionsByYear(db, gregorianYear, selectedWalletId ?? undefined);

      if (transactions.length === 0) {
        Alert.alert('ไม่มีข้อมูล', `ไม่พบรายการในปี ${selectedYear}`);
        setIsLoading(false);
        return;
      }

      const result = await analyzeFinances({
        year: gregorianYear,
        walletId: selectedWalletId,
        promptType,
        transactions,
      });

      setCurrentResult({ type: result.responseType, data: result.result });

      await addHistory({
        walletId: selectedWalletId,
        promptType,
        year: gregorianYear,
        responseType: result.responseType,
        responseData: result.result,
      });
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message ?? 'ไม่สามารถวิเคราะห์ได้');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedWalletId, promptType, gregorianYear, addHistory]);

  const handleViewHistory = useCallback((history: AiHistory) => {
    setCurrentResult({ type: history.responseType, data: history.responseData });
  }, []);

  const handleDeleteHistory = useCallback((history: AiHistory) => {
    Alert.alert('ลบประวัติ', 'ต้องการลบประวัติการวิเคราะห์นี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteHistory(history.id) },
    ]);
  }, [deleteHistory]);

  const selectedWalletName = selectedWalletId
    ? wallets.find(w => w.id === selectedWalletId)?.name ?? 'กระเป๋า'
    : 'ทุกกระเป๋า';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-foreground text-2xl font-bold mb-4">AI วิเคราะห์การเงิน</Text>

        {/* Year Selector */}
        <Text className="text-foreground font-semibold mb-2">ปี</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {years.map(y => (
              <Pressable
                key={y}
                onPress={() => setSelectedYear(y)}
                className={`px-4 py-2 rounded-full border ${
                  selectedYear === y ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <Text className={`${selectedYear === y ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {y}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Wallet Selector */}
        <Text className="text-foreground font-semibold mb-2">กระเป๋าเงิน</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedWalletId(null)}
              className={`px-3 py-2 rounded-full border ${
                !selectedWalletId ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <Text className={`text-sm ${!selectedWalletId ? 'text-primary font-semibold' : 'text-foreground'}`}>
                ทุกกระเป๋า
              </Text>
            </Pressable>
            {wallets.map(w => (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(w.id)}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  selectedWalletId === w.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <View className="w-5 h-5 rounded-full items-center justify-center mr-1" style={{ backgroundColor: w.color }}>
                  <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={10} color="white" />
                </View>
                <Text className={`text-sm ${selectedWalletId === w.id ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {w.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Prompt Type */}
        <Text className="text-foreground font-semibold mb-2">รูปแบบ</Text>
        <View className="flex-row mb-4 rounded-xl overflow-hidden border border-border">
          <Pressable
            onPress={() => setPromptType('structured')}
            className={`flex-1 py-2.5 items-center ${promptType === 'structured' ? 'bg-primary' : 'bg-card'}`}
          >
            <Text className={`text-sm font-semibold ${promptType === 'structured' ? 'text-primary-foreground' : 'text-foreground'}`}>
              วิเคราะห์แบบสรุป
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPromptType('full')}
            className={`flex-1 py-2.5 items-center ${promptType === 'full' ? 'bg-primary' : 'bg-card'}`}
          >
            <Text className={`text-sm font-semibold ${promptType === 'full' ? 'text-primary-foreground' : 'text-foreground'}`}>
              วิเคราะห์แบบละเอียด
            </Text>
          </Pressable>
        </View>

        {/* Analyze Button */}
        <Pressable
          onPress={handleAnalyze}
          disabled={isLoading}
          className={`flex-row items-center justify-center py-4 rounded-xl mb-6 ${isLoading ? 'bg-primary/50' : 'bg-primary'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="sparkles" size={20} color="white" />
          )}
          <Text className="text-white font-bold text-lg ml-2">
            {isLoading ? 'กำลังวิเคราะห์...' : 'เริ่มวิเคราะห์'}
          </Text>
        </Pressable>

        {/* Current Result */}
        {currentResult && (
          <View className="mb-6">
            <Text className="text-foreground font-bold text-base mb-3">ผลวิเคราะห์</Text>
            <AiResultView
              responseType={currentResult.type as any}
              responseData={currentResult.data}
            />
          </View>
        )}

        {/* History */}
        {histories.length > 0 && (
          <View>
            <Text className="text-foreground font-bold text-base mb-3">ประวัติการวิเคราะห์</Text>
            {histories.map(h => (
              <Pressable
                key={h.id}
                onPress={() => handleViewHistory(h)}
                onLongPress={() => handleDeleteHistory(h)}
                className="flex-row items-center px-4 py-3 bg-card border-b border-border rounded-xl mb-2"
              >
                <Ionicons name="document-text-outline" size={20} color="#0891b2" />
                <View className="flex-1 ml-3">
                  <Text className="text-foreground font-medium">
                    ปี {h.year + 543} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} • {new Date(h.createdAt).toLocaleDateString('th-TH')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/ai-analysis.tsx"
git commit -m "feat: implement full AI Analysis screen with Gemini integration"
```

---

### Task 10: Add API Key settings row to more.tsx

**Files:**
- Modify: `app/(tabs)/more.tsx`

- [ ] **Step 1: Add API key management to more.tsx**

Add import at top:
```typescript
import { getApiKey, setApiKey, deleteApiKey } from '@/lib/api/ai';
```

Add state inside `SettingsScreen`:
```typescript
const [apiKeyStatus, setApiKeyStatus] = useState('ตรวจสอบ...');

useEffect(() => {
  getApiKey().then(key => {
    setApiKeyStatus(key ? `ตั้งค่าแล้ว (****${key.slice(-4)})` : 'ยังไม่ได้ตั้งค่า');
  });
}, []);

const handleApiKey = () => {
  Alert.prompt(
    'Gemini API Key',
    'ใส่ API Key จาก Google AI Studio',
    [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ Key', style: 'destructive', onPress: async () => {
        await deleteApiKey();
        setApiKeyStatus('ยังไม่ได้ตั้งค่า');
      }},
      { text: 'บันทึก', onPress: async (key) => {
        if (key?.trim()) {
          await setApiKey(key.trim());
          setApiKeyStatus(`ตั้งค่าแล้ว (****${key.trim().slice(-4)})`);
        }
      }},
    ],
    'plain-text',
    '',
    'default'
  );
};
```

Add new settings row after the theme row (inside the "ทั่วไป" section):
```typescript
<SettingsRow icon="key-outline" label="Gemini API Key" value={apiKeyStatus} onPress={handleApiKey} />
```

Note: `Alert.prompt` is iOS-only. For Android, use a simple `Alert.alert` with a TextInput or prompt library. For now this works on iOS; Android support can be added later with a modal.

- [ ] **Step 2: Add missing imports**

Add `useEffect, useState` to the react import and the API key imports.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/more.tsx"
git commit -m "feat: add Gemini API Key management to settings screen"
```

---

### Task 11: Verify TypeScript compilation

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
git commit -m "fix: resolve TypeScript errors from Phase 3 changes"
```

---

### Summary

| Task | Description | Files |
|------|------------|-------|
| 1 | Install @google/generative-ai | package.json |
| 2 | DB queries: monthly summaries + yearly transactions + AI history | db.ts |
| 3 | AI API client (secure key + Gemini) | lib/api/ai.ts (new) |
| 4 | AI history store | ai-history-store.ts (new) |
| 5 | App boot: load AI history | _layout.tsx |
| 6 | AiResultView component | AiResultView.tsx (new) |
| 7 | WalletsContent component | WalletsContent.tsx (new) |
| 8 | Analytics: wallet filter + wallet tab + historical bar | analytics.tsx |
| 9 | AI Analysis screen | ai-analysis.tsx |
| 10 | API Key settings in more.tsx | more.tsx |
| 11 | TypeScript verification | all |
