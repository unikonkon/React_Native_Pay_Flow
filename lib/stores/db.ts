import { useCallback, useEffect, useState } from 'react';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Analysis, Category, MatchType, Transaction, TransactionType, Wallet, WalletType } from '@/types';
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
  await migrateWalletId(db);
  await seedDefaultWallet(db);
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

async function migrateWalletId(db: SQLiteDatabase) {
  const txCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');
  if (!txCols.some(c => c.name === 'wallet_id')) {
    await db.execAsync("ALTER TABLE transactions ADD COLUMN wallet_id TEXT DEFAULT 'wallet-cash'");
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id)');
  }
}

async function seedDefaultWallet(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM wallets WHERE id = 'wallet-cash'"
  );
  if (existing && existing.count > 0) return;

  await db.runAsync(
    `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['wallet-cash', 'เงินสด', 'cash', 'cash-outline', '#22C55E', 'THB', 0, 0, 1, new Date().toISOString()]
  );
}

// ===== Transaction Queries =====

export async function getTransactionsByMonth(db: SQLiteDatabase, month: string): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; note: string | null;
    date: string; created_at: string; wallet_id: string | null;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
    cat_is_custom: number; cat_sort_order: number;
    w_name: string | null; w_type: string | null; w_icon: string | null; w_color: string | null;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
            c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order,
            w.name as w_name, w.type as w_type, w.icon as w_icon, w.color as w_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
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
    walletId: r.wallet_id ?? 'wallet-cash',
    category: {
      id: r.category_id,
      name: r.cat_name,
      icon: r.cat_icon,
      color: r.cat_color,
      type: r.cat_type as TransactionType,
      isCustom: r.cat_is_custom === 1,
      sortOrder: r.cat_sort_order,
    },
    wallet: r.w_name ? { id: r.wallet_id!, name: r.w_name, type: r.w_type as WalletType, icon: r.w_icon!, color: r.w_color!, currency: 'THB', initialBalance: 0, currentBalance: 0, isAsset: true, createdAt: '' } : undefined,
  }));
}

export async function getAllTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  const rows = await db.getAllAsync<{
    id: string; type: string; amount: number; category_id: string; note: string | null;
    date: string; created_at: string; wallet_id: string | null;
    cat_name: string; cat_icon: string; cat_color: string; cat_type: string;
    cat_is_custom: number; cat_sort_order: number;
    w_name: string | null; w_type: string | null; w_icon: string | null; w_color: string | null;
  }>(
    `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
            c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order,
            w.name as w_name, w.type as w_type, w.icon as w_icon, w.color as w_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
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
    walletId: r.wallet_id ?? 'wallet-cash',
    category: {
      id: r.category_id,
      name: r.cat_name,
      icon: r.cat_icon,
      color: r.cat_color,
      type: r.cat_type as TransactionType,
      isCustom: r.cat_is_custom === 1,
      sortOrder: r.cat_sort_order,
    },
    wallet: r.w_name ? { id: r.wallet_id!, name: r.w_name, type: r.w_type as WalletType, icon: r.w_icon!, color: r.w_color!, currency: 'THB', initialBalance: 0, currentBalance: 0, isAsset: true, createdAt: '' } : undefined,
  }));
}

export async function insertTransaction(
  db: SQLiteDatabase,
  data: { type: TransactionType; amount: number; categoryId: string; note?: string; date: string; walletId?: string }
) {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at, wallet_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.type, data.amount, data.categoryId, data.note ?? null, data.date, createdAt, data.walletId ?? 'wallet-cash']
  );

  return id;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  data: Partial<{ type: TransactionType; amount: number; categoryId: string; note: string; date: string; walletId: string }>
) {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.amount !== undefined) { sets.push('amount = ?'); values.push(data.amount); }
  if (data.categoryId !== undefined) { sets.push('category_id = ?'); values.push(data.categoryId); }
  if (data.note !== undefined) { sets.push('note = ?'); values.push(data.note); }
  if (data.date !== undefined) { sets.push('date = ?'); values.push(data.date); }
  if (data.walletId !== undefined) { sets.push('wallet_id = ?'); values.push(data.walletId); }

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

// ===== Wallet Queries =====

export async function getAllWallets(db: SQLiteDatabase): Promise<Wallet[]> {
  const rows = await db.getAllAsync<{
    id: string; name: string; type: string; icon: string; color: string;
    currency: string; initial_balance: number; current_balance: number;
    is_asset: number; created_at: string;
  }>('SELECT * FROM wallets ORDER BY created_at');

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as WalletType,
    icon: r.icon,
    color: r.color,
    currency: r.currency,
    initialBalance: r.initial_balance,
    currentBalance: r.current_balance,
    isAsset: r.is_asset === 1,
    createdAt: r.created_at,
  }));
}

export async function insertWallet(
  db: SQLiteDatabase,
  data: { name: string; type: WalletType; icon: string; color: string }
): Promise<string> {
  const id = generateId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
     VALUES (?, ?, ?, ?, ?, 'THB', 0, 0, 1, ?)`,
    [id, data.name, data.type, data.icon, data.color, createdAt]
  );
  return id;
}

export async function updateWallet(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<{ name: string; type: WalletType; icon: string; color: string }>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (updates.name !== undefined) { sets.push('name = ?'); values.push(updates.name); }
  if (updates.type !== undefined) { sets.push('type = ?'); values.push(updates.type); }
  if (updates.icon !== undefined) { sets.push('icon = ?'); values.push(updates.icon); }
  if (updates.color !== undefined) { sets.push('color = ?'); values.push(updates.color); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE wallets SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteWallet(db: SQLiteDatabase, id: string): Promise<void> {
  if (id === 'wallet-cash') return;
  await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
}

export async function getWalletTransactionCount(db: SQLiteDatabase, walletId: string): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE wallet_id = ?',
    [walletId]
  );
  return result?.count ?? 0;
}

// ===== AI History Queries (stubs - implement in Phase 3) =====

export async function getAiHistory(db: SQLiteDatabase) {
  return db.getAllAsync('SELECT * FROM ai_history ORDER BY created_at DESC');
}

// ===== Analysis Queries =====

export async function findAnalysisMatch(
  db: SQLiteDatabase,
  data: { walletId: string; categoryId: string; type: TransactionType; amount: number; note?: string }
): Promise<{ id: string; matchType: 'basic' | 'full'; count: number } | null> {
  if (data.note) {
    const full = await db.getFirstAsync<{ id: string; count: number }>(
      `SELECT id, count FROM analysis
       WHERE wallet_id = ? AND category_id = ? AND type = ? AND amount = ? AND note = ? AND match_type = 'full'`,
      [data.walletId, data.categoryId, data.type, data.amount, data.note]
    );
    if (full) return { id: full.id, matchType: 'full', count: full.count };
  }

  const basic = await db.getFirstAsync<{ id: string; count: number }>(
    `SELECT id, count FROM analysis
     WHERE wallet_id = ? AND category_id = ? AND type = ? AND amount = ? AND match_type = 'basic'`,
    [data.walletId, data.categoryId, data.type, data.amount]
  );
  if (basic) return { id: basic.id, matchType: 'basic', count: basic.count };
  return null;
}

export async function upsertAnalysis(
  db: SQLiteDatabase,
  data: { walletId: string; categoryId: string; type: TransactionType; amount: number; note?: string; transactionId: string },
  matchType: 'basic' | 'full'
): Promise<void> {
  const now = new Date().toISOString();
  const match = await findAnalysisMatch(db, data);
  if (match) {
    await db.runAsync(
      `UPDATE analysis SET count = count + 1, last_transaction_id = ?, updated_at = ? WHERE id = ?`,
      [data.transactionId, now, match.id]
    );
  } else {
    const id = generateId();
    await db.runAsync(
      `INSERT INTO analysis (id, wallet_id, type, category_id, amount, note, match_type, count, last_transaction_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [id, data.walletId, data.type, data.categoryId, data.amount, data.note ?? null, matchType, data.transactionId, now, now]
    );
  }
}

export async function getTopAnalyses(db: SQLiteDatabase, limit: number = 6): Promise<Analysis[]> {
  const rows = await db.getAllAsync<{
    id: string; wallet_id: string; type: string; category_id: string;
    amount: number; note: string | null; match_type: string;
    count: number; last_transaction_id: string;
    created_at: string; updated_at: string;
  }>(
    'SELECT * FROM analysis WHERE count >= 2 ORDER BY count DESC LIMIT ?',
    [limit]
  );

  return rows.map(r => ({
    id: r.id,
    walletId: r.wallet_id,
    type: r.type as TransactionType,
    categoryId: r.category_id,
    amount: r.amount,
    note: r.note ?? undefined,
    matchType: r.match_type as MatchType,
    count: r.count,
    lastTransactionId: r.last_transaction_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function deleteAnalysisByWalletId(db: SQLiteDatabase, walletId: string): Promise<void> {
  await db.runAsync('DELETE FROM analysis WHERE wallet_id = ?', [walletId]);
}
