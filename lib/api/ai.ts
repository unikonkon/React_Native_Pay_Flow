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
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      JSON.parse(cleaned);
      return { success: true, responseType: 'structured', result: cleaned };
    } catch {
      return { success: true, responseType: 'text', result: text };
    }
  }

  return { success: true, responseType: 'full', result: text };
}
