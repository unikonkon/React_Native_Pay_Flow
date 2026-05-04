import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FinancialSummary, Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

// ===== Config =====

const API_KEY_STORE = 'gemini_api_key';

// ===== API Key Management (SecureStore) =====

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

const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function getThaiMonthName(month: number): string {
  return THAI_MONTHS[month] ?? '';
}

/**
 * Computes a normalized FinancialSummary client-side from the raw transactions.
 * Done locally (not by AI) so the numbers are always correct regardless of
 * what the model returns. Persists into responseData JSON for history reuse.
 */
function computeFinancialSummary(
  transactions: Transaction[],
  periodDays: number,
): FinancialSummary {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Group by (type | categoryId) so the same category name on income vs expense
  // doesn't collapse into one row.
  const catMap = new Map<string, { name: string; type: 'income' | 'expense'; total: number; count: number }>();
  for (const tx of transactions) {
    const key = `${tx.type}|${tx.categoryId}`;
    const existing = catMap.get(key);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      catMap.set(key, {
        name: tx.category?.name ?? 'อื่นๆ',
        type: tx.type,
        total: tx.amount,
        count: 1,
      });
    }
  }
  const categories = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

  return {
    totalIncome,
    totalExpense,
    netSaving: totalIncome - totalExpense,
    periodDays,
    categories,
  };
}

function computePeriodDays(year: number, month: number | null): number {
  if (month) return new Date(year, month, 0).getDate();
  // Yearly mode — use a calendar-aware count if it ever matters; 365 is plenty
  // accurate for the day-rate displays.
  return 365;
}

function buildTransactionSummary(transactions: Transaction[], periodLabel: string): string {
  const income = transactions.filter(t => t.type === 'income');
  const expense = transactions.filter(t => t.type === 'expense');

  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expense.reduce((s, t) => s + t.amount, 0);

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

  return `ข้อมูลการเงิน (${periodLabel}):
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

function buildSavingsGoalPrompt(
  summary: string,
  targetAmount: number,
  targetMonths: number,
): string {
  const monthlyRequired = targetAmount / targetMonths;
  return `คุณเป็นที่ปรึกษาการเงินส่วนบุคคล ผู้ใช้ตั้งเป้าหมายเก็บเงินดังนี้:
- จำนวนที่ต้องการเก็บ: ${formatCurrency(targetAmount)}
- ระยะเวลา: ${targetMonths} เดือน
- ต้องเก็บต่อเดือนเฉลี่ย: ${formatCurrency(monthlyRequired)}

วิเคราะห์ข้อมูลการเงินปัจจุบันของผู้ใช้แล้วบอกว่าควรลด/เพิ่มอะไรเพื่อให้ถึงเป้า ตอบเป็น JSON เท่านั้น (ห้ามใส่ markdown code block) ภาษาไทย

${summary}

ตอบเป็น JSON ตามรูปแบบนี้ทุกฟิลด์ ห้ามขาด:
{
  "goal": {
    "targetAmount": ${targetAmount},
    "targetMonths": ${targetMonths},
    "monthlyRequired": ${monthlyRequired}
  },
  "feasibility": {
    "currentMonthlySaving": ตัวเลขเงินออมเฉลี่ยต่อเดือนปัจจุบัน (รายรับ-รายจ่าย หารด้วยจำนวนเดือนของข้อมูล),
    "monthlyGap": ตัวเลข (currentMonthlySaving − monthlyRequired) ติดลบหมายถึงขาด,
    "feasible": true/false (ทำได้หรือไม่ภายใต้พฤติกรรมเดิม),
    "message": "ข้อความอธิบาย 1-2 ประโยค"
  },
  "expensesToCut": [
    {
      "category": "ชื่อหมวดที่ควรลด",
      "currentAmount": ตัวเลขที่ใช้ปัจจุบัน (จากข้อมูลที่ให้มา),
      "suggestedReduction": ตัวเลขจำนวนเงินที่ควรลด **ต่อเดือน**,
      "dailyReduction": ตัวเลขจำนวนเงินที่ควรลด **ต่อวัน** = suggestedReduction หารด้วย 30 (ปัดเป็นจำนวนเต็มที่ใกล้เคียง),
      "targetAmount": ตัวเลขที่ควรใช้หลังลด **ต่อเดือน**,
      "reason": "เหตุผลที่ควรลด อ้างอิงจากข้อมูลจริงในสรุปการเงินที่ให้มา"
    }
  ],
  "incomeOpportunities": [
    {
      "source": "แหล่งรายได้เสริมที่แนะนำ",
      "estimatedAmount": ตัวเลขรายได้เสริมต่อเดือน,
      "description": "คำอธิบายสั้น"
    }
  ],
  "actionPlan": ["ขั้นตอนปฏิบัติ 1", "ขั้นตอน 2", "ขั้นตอน 3"],
  "warnings": ["ข้อควรระวังหรือความเสี่ยง 1", "ข้อ 2"]
}

หาก feasible เท่ากับ true ให้ expensesToCut/incomeOpportunities สามารถเป็นอาเรย์ว่างได้ แต่ actionPlan ห้ามว่าง`;
}

// ===== API Call =====

export type PromptType = 'structured' | 'full';

export async function analyzeFinances(data: {
  year: number;
  month: number | null;
  walletId: string | null;
  promptType: PromptType;
  transactions: Transaction[];
}): Promise<{ responseType: 'structured' | 'full' | 'text'; result: string }> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('ยังไม่ได้ตั้งค่า Gemini API Key กรุณาตั้งค่าในหน้าตั้งค่า');
  }

  const buddhistYear = data.year + 543;
  const periodLabel = data.month
    ? `${getThaiMonthName(data.month)} ${buddhistYear}`
    : `ปี ${buddhistYear}`;

  const periodDays = computePeriodDays(data.year, data.month);
  const financialSummary = computeFinancialSummary(data.transactions, periodDays);

  const summary = buildTransactionSummary(data.transactions, periodLabel);
  const prompt = data.promptType === 'structured'
    ? buildStructuredPrompt(summary)
    : buildFullPrompt(summary);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (data.promptType === 'structured') {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Inject the locally-computed summary so the view + history both have it.
        parsed.financialSummary = financialSummary;
        return { responseType: 'structured', result: JSON.stringify(parsed) };
      }
    } catch {
      // JSON parse failed — fall through to text
    }
    return { responseType: 'text', result: text };
  }

  // Full mode — wrap the AI's prose in a JSON envelope alongside summary.
  return {
    responseType: 'full',
    result: JSON.stringify({ analysis: text, financialSummary }),
  };
}

// ===== Savings Goal Analyzer =====

export async function analyzeSavingsGoal(data: {
  year: number;
  month: number | null;
  walletId: string | null;
  targetAmount: number;
  targetMonths: number;
  transactions: Transaction[];
}): Promise<{ responseType: 'savings_goal' | 'text'; result: string }> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('ยังไม่ได้ตั้งค่า Gemini API Key กรุณาตั้งค่าในหน้าตั้งค่า');
  }

  const buddhistYear = data.year + 543;
  const periodLabel = data.month
    ? `${getThaiMonthName(data.month)} ${buddhistYear}`
    : `ปี ${buddhistYear}`;

  const periodDays = computePeriodDays(data.year, data.month);
  const financialSummary = computeFinancialSummary(data.transactions, periodDays);

  const summary = buildTransactionSummary(data.transactions, periodLabel);
  const prompt = buildSavingsGoalPrompt(summary, data.targetAmount, data.targetMonths);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsed.financialSummary = financialSummary;
      return { responseType: 'savings_goal', result: JSON.stringify(parsed) };
    }
  } catch {
    // JSON parse failed — fall through to text
  }
  return { responseType: 'text', result: text };
}
