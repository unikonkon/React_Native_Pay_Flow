import type { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_CATEGORIES_TABLE, CREATE_TRANSACTIONS_TABLE, CREATE_INDEXES } from './schema';
import { ALL_DEFAULT_CATEGORIES } from '@/constants/categories';

export async function migrateDatabase(db: SQLiteDatabase) {
  // Check if categories table has the is_custom column (v2 schema)
  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(categories)"
  );
  const hasIsCustom = tableInfo.some(col => col.name === 'is_custom');

  if (tableInfo.length > 0 && !hasIsCustom) {
    // Old schema exists — drop and recreate
    await db.execAsync('DROP TABLE IF EXISTS categories');
  }

  await db.execAsync(CREATE_CATEGORIES_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);

  for (const sql of CREATE_INDEXES) {
    await db.execAsync(sql);
  }

  await seedDefaultCategories(db);
}

async function seedDefaultCategories(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE is_custom = 0'
  );

  if (existing && existing.count > 0) return;

  for (const cat of ALL_DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, icon, color, type, is_custom, sort_order)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.sortOrder]
    );
  }
}
