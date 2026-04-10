import { File } from 'expo-file-system/next';
import type { TransactionType } from '@/types';
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

    const dateMatch = line.match(/===.*\((\d{4}-\d{2}-\d{2})\).*===/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }

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
