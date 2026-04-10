# Phase 3: Analytics & AI — Design Spec

**Date:** 2026-04-11
**Scope:** Analytics improvements (wallet filter, bar chart history, wallet comparison), AI Analysis (Gemini API, result display, history)
**Prerequisite:** Phase 2 complete (wallet system, transaction upgrades)

---

## 1. Analytics Screen Improvements

### 1.1 Wallet Filter

Add a wallet filter dropdown at the top of the analytics screen. Options: "ทุกกระเป๋า" (default) or a specific wallet. Filters all chart data by selected wallet.

Implementation: filter `transactions` array before passing to `useSummary` and chart components.

### 1.2 Bar Chart Historical Data

Current bar chart shows only the current month (other months = 0). Add a DB query to fetch monthly summaries for the last 6 months.

New query in `db.ts`:

```typescript
export async function getMonthlySummaries(
  db: SQLiteDatabase,
  months: string[],
  walletId?: string
): Promise<{ month: string; income: number; expense: number }[]>
```

Query: GROUP BY `strftime('%Y-%m', date)`, SUM amounts by type, optional `WHERE wallet_id = ?`.

### 1.3 Wallet Comparison Tab

Add a third tab "กระเป๋า" to the analytics screen. Shows horizontal bar comparison of wallet balances for the selected month.

New component: `components/analytics/WalletsContent.tsx`

Displays each wallet with:
- Icon + name + color
- Income / expense / balance for selected month
- Horizontal bar proportional to balance

---

## 2. AI Analysis System

### 2.1 API Key Management

Users enter their own Gemini API key via Settings screen. Key stored securely using `expo-secure-store`.

New file: `lib/api/ai.ts`

```typescript
export async function getApiKey(): Promise<string | null>
export async function setApiKey(key: string): Promise<void>
export async function deleteApiKey(): Promise<void>
export async function analyzeFinances(data: {
  year: number;
  walletId: string | null;
  promptType: 'structured' | 'full';
  transactionData: string;
}): Promise<{ success: boolean; result: any }>
```

- `getApiKey` / `setApiKey` / `deleteApiKey` use `expo-secure-store` with key `'gemini_api_key'`
- `analyzeFinances` calls Google Generative AI SDK (`@google/generative-ai`) with `gemini-2.0-flash` model
- Prompt templates generate Thai-language analysis including: health score, 50/30/20 rule, savings recommendations, expenses to reduce, action plan, warnings
- No rate limiting — users can analyze as many times as they want

### 2.2 AI Analysis Screen (`app/(tabs)/ai-analysis.tsx`)

Replace placeholder with full UI:

- Year picker (current year ± 2 years)
- Wallet selector ("ทุกกระเป๋า" or specific wallet)
- Prompt type selector: "วิเคราะห์แบบสรุป" (structured) / "วิเคราะห์แบบละเอียด" (full)
- "เริ่มวิเคราะห์" button — disabled if no API key set (shows message to set key in settings)
- Loading state with spinner during API call
- Result display below
- History list at bottom showing past analyses

Flow:
1. User selects year + wallet + type
2. App queries transactions for that year (+ wallet filter)
3. Builds prompt with transaction summary data
4. Calls Gemini API via `analyzeFinances()`
5. Parses response → displays result
6. Saves to ai_history table

### 2.3 AI Result Display (`components/ai/AiResultView.tsx`)

**Structured result** renders as themed cards:
- Health score card (grade + saving rate + 50/30/20 breakdown)
- Recommendations card (monthly saving/investment targets, emergency fund)
- Expenses to reduce list (category, amount, reduction target)
- Extra income section (if needed)
- Action plan list
- Warnings list

**Full result** renders as formatted text paragraphs.

Props:
```typescript
interface AiResultViewProps {
  responseType: 'structured' | 'full' | 'text';
  responseData: string; // JSON stringified
}
```

### 2.4 AI History Store (`lib/stores/ai-history-store.ts`)

```typescript
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
```

### 2.5 AI History DB Queries (`lib/stores/db.ts`)

Replace AI history stubs with real implementations:

```typescript
export async function getAllAiHistory(db): Promise<AiHistory[]>
export async function insertAiHistory(db, data): Promise<string>
export async function deleteAiHistory(db, id): Promise<void>
```

### 2.6 Settings: API Key Row

Add a new row in `app/(tabs)/more.tsx`:
- Icon: `key-outline`
- Label: "Gemini API Key"
- Value: "ยังไม่ได้ตั้งค่า" or "ตั้งค่าแล้ว"
- onPress: opens Alert.prompt or modal to enter/update key

---

## 3. Files Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `lib/api/ai.ts` | API key (secure-store) + Gemini API client |
| Create | `lib/stores/ai-history-store.ts` | AI history Zustand store |
| Create | `components/ai/AiResultView.tsx` | Structured/Full result cards |
| Create | `components/analytics/WalletsContent.tsx` | Wallet comparison bars |
| Modify | `lib/stores/db.ts` | AI history queries + getMonthlySummaries |
| Modify | `app/(tabs)/ai-analysis.tsx` | Full AI analysis UI |
| Modify | `app/(tabs)/analytics.tsx` | Wallet filter + wallet tab + historical bar data |
| Modify | `app/(tabs)/more.tsx` | API Key settings row |
| Modify | `app/_layout.tsx` | Load ai-history store on boot |

---

## 4. Dependencies

- `@google/generative-ai` — Google Gemini SDK (already in architecture doc dependencies)
- `expo-secure-store` — already configured in app.json plugins

---

## 5. What This Does NOT Include

- Budget alerts (Phase 4)
- Export/Import improvements (Phase 4)
- Theme system changes (Phase 4)
- Categories management screen (Phase 4)
