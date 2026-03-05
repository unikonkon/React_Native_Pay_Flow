import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, TransactionType } from '@/types';
import { generateId } from '@/utils/id';

export async function getAllCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: string; name: string; icon: string; color: string;
    type: string; is_custom: number; sort_order: number;
  }>('SELECT * FROM categories ORDER BY type, sort_order');

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as TransactionType,
    isCustom: r.is_custom === 1,
    sortOrder: r.sort_order,
  }));
}

export async function getCategoriesByType(db: SQLiteDatabase, type: TransactionType): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: string; name: string; icon: string; color: string;
    type: string; is_custom: number; sort_order: number;
  }>('SELECT * FROM categories WHERE type = ? ORDER BY sort_order', [type]);

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as TransactionType,
    isCustom: r.is_custom === 1,
    sortOrder: r.sort_order,
  }));
}

export async function insertCategory(
  db: SQLiteDatabase,
  data: { name: string; icon: string; color: string; type: TransactionType }
) {
  const id = generateId();
  const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM categories WHERE type = ?',
    [data.type]
  );

  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [id, data.name, data.icon, data.color, data.type, (maxOrder?.max_order ?? -1) + 1]
  );

  return id;
}

export async function deleteCategory(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM categories WHERE id = ? AND is_custom = 1', [id]);
}
