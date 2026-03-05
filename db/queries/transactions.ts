import type { SQLiteDatabase } from 'expo-sqlite';
import type { Transaction, TransactionType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function getTransactionsByMonth(db: SQLiteDatabase, month: string): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; note: string | null;
    date: string; created_at: string;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
    cat_is_custom: number; cat_sort_order: number;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
            c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE strftime('%Y-%m', t.date) = ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [month]
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
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

export async function getAllTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; note: string | null;
    date: string; created_at: string;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color, c.type as cat_type
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC, t.created_at DESC`
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: r.created_at,
    category: {
      id: r.category_id,
      name: r.cat_name,
      icon: r.cat_icon,
      color: r.cat_color,
      type: r.cat_type as TransactionType,
      isCustom: false,
      sortOrder: 0,
    },
  }));
}

export async function insertTransaction(
  db: SQLiteDatabase,
  data: { type: TransactionType; amount: number; categoryId: string; note?: string; date: string }
) {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.type, data.amount, data.categoryId, data.note ?? null, data.date, createdAt]
  );

  return id;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  data: Partial<{ type: TransactionType; amount: number; categoryId: string; note: string; date: string }>
) {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.amount !== undefined) { sets.push('amount = ?'); values.push(data.amount); }
  if (data.categoryId !== undefined) { sets.push('category_id = ?'); values.push(data.categoryId); }
  if (data.note !== undefined) { sets.push('note = ?'); values.push(data.note); }
  if (data.date !== undefined) { sets.push('date = ?'); values.push(data.date); }

  if (sets.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteTransaction(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}
