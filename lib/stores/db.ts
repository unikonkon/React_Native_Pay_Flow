import { useCallback, useEffect, useState } from 'react';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Category, Transaction, TransactionType } from '@/types';
import { generateId } from '@/lib/utils/id';
import { ALL_DEFAULT_CATEGORIES } from '@/lib/constants/categories';

// ===== Database Singleton =====

let dbInstance: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
}

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);

  const initDB = useCallback(async () => {
    if (dbInstance) {
      setIsReady(true);
      return;
    }

    const db = await openDatabaseAsync('ceasflow.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await migrateDatabase(db);
    dbInstance = db;
    setIsReady(true);
  }, []);

  useEffect(() => {
    initDB();
  }, [initDB]);

  return { isReady, db: dbInstance };
}

// ===== Schema =====

const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    icon       TEXT NOT NULL,
    color      TEXT NOT NULL,
    type       TEXT NOT NULL CHECK(type IN ('income','expense')),
    is_custom  INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );
`;

const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    amount      REAL NOT NULL,
    category_id TEXT NOT NULL,
    note        TEXT,
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`;

const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);',
];

const CREATE_WALLETS_TABLE = `
  CREATE TABLE IF NOT EXISTS wallets (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK(type IN ('cash','bank','credit_card','e_wallet','savings','daily_expense')),
    icon            TEXT NOT NULL,
    color           TEXT NOT NULL,
    currency        TEXT DEFAULT 'THB',
    initial_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    is_asset        INTEGER DEFAULT 1,
    created_at      TEXT NOT NULL
  );
`;

const CREATE_AI_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS ai_history (
    id            TEXT PRIMARY KEY,
    wallet_id     TEXT,
    prompt_type   TEXT NOT NULL,
    year          INTEGER NOT NULL,
    response_type TEXT NOT NULL,
    response_data TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );
`;

const CREATE_ANALYSIS_TABLE = `
  CREATE TABLE IF NOT EXISTS analysis (
    id                  TEXT PRIMARY KEY,
    wallet_id           TEXT NOT NULL,
    type                TEXT NOT NULL,
    category_id         TEXT NOT NULL,
    amount              REAL NOT NULL,
    note                TEXT,
    match_type          TEXT NOT NULL CHECK(match_type IN ('basic', 'full')),
    count               INTEGER DEFAULT 1,
    last_transaction_id TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
  );
`;

const CREATE_WALLETS_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_wallets_type ON wallets(type);';

// ===== Migrations =====

async function migrateDatabase(db: SQLiteDatabase) {
  // Check if old schema exists and drop to recreate with new schema
  const catInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(categories)');
  const txInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');

  if (catInfo.length > 0 && !catInfo.some(c => c.name === 'is_custom')) {
    await db.execAsync('DROP TABLE IF EXISTS categories');
  }
  if (txInfo.length > 0 && txInfo.some(c => c.name === 'book_id')) {
    await db.execAsync('DROP TABLE IF EXISTS transactions');
  }

  await db.execAsync(CREATE_CATEGORIES_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);

  for (const sql of CREATE_INDEXES) {
    await db.execAsync(sql);
  }

  await db.execAsync(CREATE_WALLETS_TABLE);
  await db.execAsync(CREATE_AI_HISTORY_TABLE);
  await db.execAsync(CREATE_ANALYSIS_TABLE);
  await db.execAsync(CREATE_WALLETS_INDEX);

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

// ===== Transaction Queries =====

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
  const id = generateId();
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

// ===== Category Queries =====

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

// ===== Wallet Queries (stubs - implement in Phase 2) =====

export async function getAllWallets(db: SQLiteDatabase) {
  return db.getAllAsync('SELECT * FROM wallets ORDER BY created_at');
}

export async function insertWallet(
  db: SQLiteDatabase,
  _data: { name: string; type: string; icon: string; color: string }
) {
  // Stub - implement in Phase 2
  void db;
}

// ===== AI History Queries (stubs - implement in Phase 3) =====

export async function getAiHistory(db: SQLiteDatabase) {
  return db.getAllAsync('SELECT * FROM ai_history ORDER BY created_at DESC');
}

// ===== Analysis Queries (stubs - implement in Phase 2) =====

export async function getAnalysis(db: SQLiteDatabase) {
  return db.getAllAsync('SELECT * FROM analysis ORDER BY count DESC');
}
