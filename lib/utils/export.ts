import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system/next';
import type { Transaction } from '@/types';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportToCSV(transactions: Transaction[]) {
  const BOM = '\uFEFF';
  const header = 'วันที่,ประเภท,หมวดหมู่,จำนวนเงิน,หมายเหตุ';
  const rows = transactions.map(t =>
    [
      t.date,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      escapeCSV(t.category?.name ?? ''),
      t.amount.toString(),
      escapeCSV(t.note || ''),
    ].join(',')
  );

  const csv = BOM + [header, ...rows].join('\n');
  const filePath = `${Paths.document}/expense_${Date.now()}.csv`;
  const file = new File(filePath);
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}

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
