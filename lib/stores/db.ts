import { ALL_DEFAULT_CATEGORIES } from "@/lib/constants/categories";
import { generateId } from "@/lib/utils/id";
import type {
  AiHistory,
  AiPromptType,
  Analysis,
  Category,
  MatchType,
  Transaction,
  TransactionType,
  Wallet,
  WalletType,
} from "@/types";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

// ===== Database Singleton =====

let dbInstance: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!dbInstance) throw new Error("Database not initialized");
  return dbInstance;
}

// Fix 2 — PRAGMA optimize for mobile
export function useDatabase() {
  const [isReady, setIsReady] = useState(false);

  const initDB = useCallback(async () => {
    if (dbInstance) {
      setIsReady(true);
      return;
    }

    const db = await openDatabaseAsync("ceasflow.db");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA cache_size = -8000;
      PRAGMA temp_store = MEMORY;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
    `);
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
  "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);",
  "CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);",
  "CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);",
  "CREATE INDEX IF NOT EXISTS idx_transactions_date_created ON transactions(date DESC, created_at DESC);",
  "CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date ON transactions(wallet_id, date DESC, created_at DESC);",
  // Fix 8 — Composite index on analysis
  "CREATE INDEX IF NOT EXISTS idx_analysis_wallet_type ON analysis(wallet_id, type, count DESC);",
  "CREATE INDEX IF NOT EXISTS idx_analysis_lookup ON analysis(wallet_id, category_id, type, amount, match_type);",
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
  "CREATE INDEX IF NOT EXISTS idx_wallets_type ON wallets(type);";

// ===== Fix 7 — Shared row type + mapTransactionRow helper =====

type RawTransactionRow = {
  id: string;
  type: string;
  amount: number;
  category_id: string;
  note: string | null;
  date: string;
  created_at: string;
  wallet_id: string | null;
  cat_name: string;
  cat_icon: string;
  cat_color: string;
  cat_type: string;
  cat_is_custom: number;
  cat_sort_order: number;
  w_name: string | null;
  w_type: string | null;
  w_icon: string | null;
  w_color: string | null;
};

const TX_SELECT = `
  SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
         c.type as cat_type, c.is_custom as cat_is_custom, c.sort_order as cat_sort_order,
         w.name as w_name, w.type as w_type, w.icon as w_icon, w.color as w_color
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN wallets w ON t.wallet_id = w.id`;

function mapTransactionRow(r: RawTransactionRow): Transaction {
  return {
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    categoryId: r.category_id,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: r.created_at,
    walletId: r.wallet_id ?? "wallet-cash",
    category: {
      id: r.category_id,
      name: r.cat_name,
      icon: r.cat_icon,
      color: r.cat_color,
      type: r.cat_type as TransactionType,
      isCustom: r.cat_is_custom === 1,
      sortOrder: r.cat_sort_order,
    },
    wallet: r.w_name
      ? {
          id: r.wallet_id!,
          name: r.w_name,
          type: r.w_type as WalletType,
          icon: r.w_icon!,
          color: r.w_color!,
          currency: "THB",
          initialBalance: 0,
          currentBalance: 0,
          isAsset: true,
          createdAt: "",
        }
      : undefined,
  };
}

// ===== Migrations =====

async function migrateDatabase(db: SQLiteDatabase) {
  // Check if old schema exists and drop to recreate with new schema
  const catInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(categories)",
  );
  const txInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(transactions)",
  );

  if (catInfo.length > 0 && !catInfo.some((c) => c.name === "is_custom")) {
    await db.execAsync("DROP TABLE IF EXISTS categories");
  }
  if (txInfo.length > 0 && txInfo.some((c) => c.name === "book_id")) {
    await db.execAsync("DROP TABLE IF EXISTS transactions");
  }

  await db.execAsync(CREATE_CATEGORIES_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);

  // Check if wallets table has old schema (missing currency column) and recreate
  const walletInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(wallets)",
  );
  if (walletInfo.length > 0 && !walletInfo.some((c) => c.name === "currency")) {
    await db.execAsync("DROP TABLE IF EXISTS wallets");
  }

  await db.execAsync(CREATE_WALLETS_TABLE);
  await db.execAsync(CREATE_AI_HISTORY_TABLE);
  await db.execAsync(CREATE_ANALYSIS_TABLE);
  await db.execAsync(CREATE_WALLETS_INDEX);

  // wallet_id column must exist before creating indexes that reference it
  await migrateWalletId(db);

  // Indexes must be created after all tables AND after wallet_id column exists
  for (const sql of CREATE_INDEXES) {
    await db.execAsync(sql);
  }

  await seedDefaultCategories(db);
  await migrateDefaultCategories(db);
  await seedDefaultWallet(db);
  await migrateAiHistoryMonth(db);
  await migrateWalletSortOrder(db);
}

async function seedDefaultCategories(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories WHERE is_custom = 0",
  );

  if (existing && existing.count > 0) return;

  for (const cat of ALL_DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, icon, color, type, is_custom, sort_order)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.sortOrder],
    );
  }
}

async function migrateDefaultCategories(db: SQLiteDatabase) {
  for (const cat of ALL_DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order)
       VALUES (?, ?, ?, ?, ?, 0, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         icon = excluded.icon,
         color = excluded.color,
         type = excluded.type,
         sort_order = excluded.sort_order,
         is_custom = 0`,
      [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.sortOrder],
    );
  }

  const newIds = ALL_DEFAULT_CATEGORIES.map((c) => c.id);
  const placeholders = newIds.map(() => "?").join(",");
  const oldDefaults = await db.getAllAsync<{ id: string; type: string }>(
    `SELECT id, type FROM categories WHERE is_custom = 0 AND id NOT IN (${placeholders})`,
    newIds,
  );

  for (const old of oldDefaults) {
    const fallbackId = old.type === "income" ? "inc-other" : "exp-other";
    await db.runAsync(
      "UPDATE transactions SET category_id = ? WHERE category_id = ?",
      [fallbackId, old.id],
    );
    await db.runAsync("DELETE FROM categories WHERE id = ?", [old.id]);
  }
}

async function migrateWalletId(db: SQLiteDatabase) {
  const txCols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(transactions)",
  );
  if (!txCols.some((c) => c.name === "wallet_id")) {
    await db.execAsync(
      "ALTER TABLE transactions ADD COLUMN wallet_id TEXT DEFAULT 'wallet-cash'",
    );
  }
}

async function seedDefaultWallet(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM wallets WHERE id = 'wallet-cash'",
  );
  if (existing && existing.count > 0) return;

  await db.runAsync(
    `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "wallet-cash",
      "เงินสด",
      "cash",
      "cash-outline",
      "#22C55E",
      "THB",
      0,
      0,
      1,
      new Date().toISOString(),
    ],
  );
}

// ===== Transaction Queries =====

// Fix 1 — strftime → BETWEEN (getTransactionsByMonth now uses date range)
export async function getTransactionsByMonth(
  db: SQLiteDatabase,
  month: string, // '2025-01' format — converted to BETWEEN range
): Promise<Transaction[]> {
  const [y, m] = month.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db.getAllAsync<RawTransactionRow>(
    `${TX_SELECT}
     WHERE t.date BETWEEN ? AND ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [start, end],
  );

  return rows.map(mapTransactionRow);
}

export async function getTransactionsByRange(
  db: SQLiteDatabase,
  start: string,
  end: string,
  walletId?: string | null,
): Promise<Transaction[]> {
  const params: (string | number)[] = [start, end];
  let walletFilter = "";
  if (walletId) {
    walletFilter = " AND t.wallet_id = ?";
    params.push(walletId);
  }

  const rows = await db.getAllAsync<RawTransactionRow>(
    `${TX_SELECT}
     WHERE t.date BETWEEN ? AND ?${walletFilter}
     ORDER BY t.date DESC, t.created_at DESC`,
    params,
  );

  return rows.map(mapTransactionRow);
}

export async function getSummaryByRange(
  db: SQLiteDatabase,
  start: string,
  end: string,
  walletId?: string | null,
): Promise<{ totalIncome: number; totalExpense: number }> {
  const params: (string | number)[] = [start, end];
  let walletFilter = "";
  if (walletId) {
    walletFilter = " AND wallet_id = ?";
    params.push(walletId);
  }

  const rows = await db.getAllAsync<{ type: string; total: number }>(
    `SELECT type, SUM(amount) as total FROM transactions
     WHERE date BETWEEN ? AND ?${walletFilter}
     GROUP BY type`,
    params,
  );

  return {
    totalIncome: rows.find((r) => r.type === "income")?.total ?? 0,
    totalExpense: rows.find((r) => r.type === "expense")?.total ?? 0,
  };
}

export async function getTransactionsByCategoryAndRange(
  db: SQLiteDatabase,
  categoryId: string,
  start: string,
  end: string,
  walletId?: string | null,
  type?: TransactionType | null,
): Promise<Transaction[]> {
  const params: (string | number)[] = [categoryId, start, end];
  let filters = "";
  if (walletId) {
    filters += " AND t.wallet_id = ?";
    params.push(walletId);
  }
  if (type) {
    filters += " AND t.type = ?";
    params.push(type);
  }

  const rows = await db.getAllAsync<RawTransactionRow>(
    `${TX_SELECT}
     WHERE t.category_id = ? AND t.date BETWEEN ? AND ?${filters}
     ORDER BY t.date DESC, t.created_at DESC`,
    params,
  );

  return rows.map(mapTransactionRow);
}

export async function getAllTransactions(
  db: SQLiteDatabase,
): Promise<Transaction[]> {
  const rows = await db.getAllAsync<RawTransactionRow>(
    `${TX_SELECT}
     ORDER BY t.date DESC, t.created_at DESC`,
  );

  return rows.map(mapTransactionRow);
}

export async function insertTransaction(
  db: SQLiteDatabase,
  data: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    note?: string;
    date: string;
    walletId?: string;
    createdAt?: string;
  },
) {
  const id = generateId();
  const createdAt = data.createdAt ?? new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at, wallet_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.type,
      data.amount,
      data.categoryId,
      data.note ?? null,
      data.date,
      createdAt,
      data.walletId ?? "wallet-cash",
    ],
  );

  return id;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  data: Partial<{
    type: TransactionType;
    amount: number;
    categoryId: string;
    note: string;
    date: string;
    walletId: string;
  }>,
) {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.type !== undefined) {
    sets.push("type = ?");
    values.push(data.type);
  }
  if (data.amount !== undefined) {
    sets.push("amount = ?");
    values.push(data.amount);
  }
  if (data.categoryId !== undefined) {
    sets.push("category_id = ?");
    values.push(data.categoryId);
  }
  if (data.note !== undefined) {
    sets.push("note = ?");
    values.push(data.note);
  }
  if (data.date !== undefined) {
    sets.push("date = ?");
    values.push(data.date);
  }
  if (data.walletId !== undefined) {
    sets.push("wallet_id = ?");
    values.push(data.walletId);
  }

  if (sets.length === 0) return;

  values.push(id);
  await db.runAsync(
    `UPDATE transactions SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );
}

export async function deleteTransaction(db: SQLiteDatabase, id: string) {
  await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

// Fix 5 — Batch delete in 1 query
export async function deleteTransactionsBatch(
  db: SQLiteDatabase,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  await db.runAsync(
    `DELETE FROM transactions WHERE id IN (${placeholders})`,
    ids,
  );
}

// ===== Category Queries =====

export async function getAllCategories(
  db: SQLiteDatabase,
): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
    is_custom: number;
    sort_order: number;
  }>("SELECT * FROM categories ORDER BY type, sort_order");

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as TransactionType,
    isCustom: r.is_custom === 1,
    sortOrder: r.sort_order,
  }));
}

export async function getCategoriesByType(
  db: SQLiteDatabase,
  type: TransactionType,
): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
    is_custom: number;
    sort_order: number;
  }>("SELECT * FROM categories WHERE type = ? ORDER BY sort_order", [type]);

  return rows.map((r) => ({
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
  data: { name: string; icon: string; color: string; type: TransactionType },
) {
  const id = generateId();
  const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
    "SELECT MAX(sort_order) as max_order FROM categories WHERE type = ?",
    [data.type],
  );

  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [
      id,
      data.name,
      data.icon,
      data.color,
      data.type,
      (maxOrder?.max_order ?? -1) + 1,
    ],
  );

  return id;
}

export async function deleteCategory(db: SQLiteDatabase, id: string) {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM analysis WHERE category_id = ?", [id]);
    await db.runAsync("DELETE FROM transactions WHERE category_id = ?", [id]);
    await db.runAsync("DELETE FROM categories WHERE id = ? AND is_custom = 1", [
      id,
    ]);
  });
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<{ name: string; icon: string; color: string }>,
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (updates.name !== undefined) {
    sets.push("name = ?");
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    sets.push("icon = ?");
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    sets.push("color = ?");
    values.push(updates.color);
  }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(
    `UPDATE categories SET ${sets.join(", ")} WHERE id = ? AND is_custom = 1`,
    values,
  );
}

// Fix 6 — reorderCategories: N UPDATE → 1 CASE WHEN
export async function reorderCategories(
  db: SQLiteDatabase,
  type: TransactionType,
  orderedIds: string[],
): Promise<void> {
  if (orderedIds.length === 0) return;

  const cases = orderedIds.map((_, i) => `WHEN ? THEN ${i}`).join(" ");
  const placeholders = orderedIds.map(() => "?").join(",");
  const params = [...orderedIds, ...orderedIds, type];

  await db.runAsync(
    `UPDATE categories
     SET sort_order = CASE id ${cases} END
     WHERE id IN (${placeholders}) AND type = ?`,
    params,
  );
}

// ===== Monthly Summary Queries =====

// Fix 1 — getMonthlySummaries: strftime → BETWEEN per month
export async function getMonthlySummaries(
  db: SQLiteDatabase,
  months: string[],
  walletId?: string,
): Promise<{ month: string; income: number; expense: number }[]> {
  if (months.length === 0) return [];

  // Build UNION ALL query: one SELECT per month using BETWEEN
  const unions = months
    .map(
      (_, i) =>
        `SELECT ${i} as idx, type, SUM(amount) as total
       FROM transactions
       WHERE date BETWEEN ? AND ?${walletId ? " AND wallet_id = ?" : ""}
       GROUP BY type`,
    )
    .join(" UNION ALL ");

  const params: (string | number)[] = [];
  for (const m of months) {
    const [y, mo] = m.split("-").map(Number);
    const start = `${y}-${String(mo).padStart(2, "0")}-01`;
    const lastDay = new Date(y, mo, 0).getDate();
    const end = `${y}-${String(mo).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    params.push(start, end);
    if (walletId) params.push(walletId);
  }

  const rows = await db.getAllAsync<{
    idx: number;
    type: string;
    total: number;
  }>(unions, params);

  return months.map((m, i) => ({
    month: m,
    income: rows.find((r) => r.idx === i && r.type === "income")?.total ?? 0,
    expense: rows.find((r) => r.idx === i && r.type === "expense")?.total ?? 0,
  }));
}

// Fix 3 — getSummariesByBuckets: N queries → 1 UNION ALL query
export async function getSummariesByBuckets(
  db: SQLiteDatabase,
  buckets: { start: string; end: string; label: string }[],
  walletId?: string,
): Promise<{ label: string; income: number; expense: number }[]> {
  if (buckets.length === 0) return [];

  const unions = buckets
    .map(
      (_, i) =>
        `SELECT ${i} as idx, type, SUM(amount) as total
       FROM transactions
       WHERE date BETWEEN ? AND ?${walletId ? " AND wallet_id = ?" : ""}
       GROUP BY type`,
    )
    .join(" UNION ALL ");

  const params: (string | number)[] = [];
  for (const b of buckets) {
    params.push(b.start, b.end);
    if (walletId) params.push(walletId);
  }

  const rows = await db.getAllAsync<{
    idx: number;
    type: string;
    total: number;
  }>(unions, params);

  return buckets.map((b, i) => ({
    label: b.label,
    income: rows.find((r) => r.idx === i && r.type === "income")?.total ?? 0,
    expense: rows.find((r) => r.idx === i && r.type === "expense")?.total ?? 0,
  }));
}

// Fix 1 — getTransactionsByYear: strftime → BETWEEN
export async function getTransactionsByYear(
  db: SQLiteDatabase,
  year: number,
  walletId?: string,
): Promise<Transaction[]> {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const params: (string | number)[] = [start, end];
  let walletFilter = "";
  if (walletId) {
    walletFilter = " AND t.wallet_id = ?";
    params.push(walletId);
  }

  const rows = await db.getAllAsync<RawTransactionRow>(
    `${TX_SELECT}
     WHERE t.date BETWEEN ? AND ?${walletFilter}
     ORDER BY t.date DESC, t.created_at DESC`,
    params,
  );

  return rows.map(mapTransactionRow);
}

export async function getAvailableYears(
  db: SQLiteDatabase,
  walletId?: string | null,
): Promise<number[]> {
  const params: string[] = [];
  let walletFilter = "";
  if (walletId) {
    walletFilter = " WHERE wallet_id = ?";
    params.push(walletId);
  }

  const rows = await db.getAllAsync<{ year: string }>(
    `SELECT DISTINCT substr(date, 1, 4) as year FROM transactions${walletFilter} ORDER BY year DESC`,
    params,
  );

  return rows.map((r) => parseInt(r.year, 10)).filter((y) => !isNaN(y));
}

export async function getAvailableMonths(
  db: SQLiteDatabase,
  year: number,
  walletId?: string | null,
): Promise<number[]> {
  const params: (string | number)[] = [`${year}-01-01`, `${year}-12-31`];
  let walletFilter = "";
  if (walletId) {
    walletFilter = " AND wallet_id = ?";
    params.push(walletId);
  }

  const rows = await db.getAllAsync<{ m: string }>(
    `SELECT DISTINCT substr(date, 6, 2) as m FROM transactions
     WHERE date BETWEEN ? AND ?${walletFilter}
     ORDER BY m`,
    params,
  );

  return rows.map((r) => parseInt(r.m, 10)).filter((m) => !isNaN(m));
}

// ===== Wallet Queries =====

export async function getAllWallets(db: SQLiteDatabase): Promise<Wallet[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    type: string;
    icon: string;
    color: string;
    currency: string;
    initial_balance: number;
    current_balance: number;
    is_asset: number;
    created_at: string;
  }>("SELECT * FROM wallets ORDER BY sort_order, created_at");

  return rows.map((r) => ({
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
  data: { name: string; type: WalletType; icon: string; color: string },
): Promise<string> {
  const id = generateId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
     VALUES (?, ?, ?, ?, ?, 'THB', 0, 0, 1, ?)`,
    [id, data.name, data.type, data.icon, data.color, createdAt],
  );
  return id;
}

export async function updateWallet(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<{
    name: string;
    type: WalletType;
    icon: string;
    color: string;
  }>,
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (updates.name !== undefined) {
    sets.push("name = ?");
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    sets.push("type = ?");
    values.push(updates.type);
  }
  if (updates.icon !== undefined) {
    sets.push("icon = ?");
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    sets.push("color = ?");
    values.push(updates.color);
  }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(
    `UPDATE wallets SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );
}

export async function deleteWallet(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM transactions WHERE wallet_id = ?", [id]);
    await db.runAsync("DELETE FROM analysis WHERE wallet_id = ?", [id]);
    await db.runAsync("DELETE FROM wallets WHERE id = ?", [id]);
  });
}

export async function reorderWallets(
  db: SQLiteDatabase,
  orderedIds: string[],
): Promise<void> {
  if (orderedIds.length === 0) return;
  const cases = orderedIds.map((_, i) => `WHEN ? THEN ${i}`).join(" ");
  const placeholders = orderedIds.map(() => "?").join(",");
  const params = [...orderedIds, ...orderedIds];
  await db.runAsync(
    `UPDATE wallets SET sort_order = CASE id ${cases} END WHERE id IN (${placeholders})`,
    params,
  );
}

export async function getWalletTransactionCount(
  db: SQLiteDatabase,
  walletId: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM transactions WHERE wallet_id = ?",
    [walletId],
  );
  return result?.count ?? 0;
}

// ===== AI History Queries =====

export async function getAllAiHistory(
  db: SQLiteDatabase,
): Promise<AiHistory[]> {
  const rows = await db.getAllAsync<{
    id: string;
    wallet_id: string | null;
    prompt_type: string;
    year: number;
    month: number | null;
    response_type: string;
    response_data: string;
    created_at: string;
  }>("SELECT * FROM ai_history ORDER BY created_at DESC");

  return rows.map((r) => ({
    id: r.id,
    walletId: r.wallet_id,
    promptType: r.prompt_type as AiPromptType,
    year: r.year,
    month: r.month,
    responseType: r.response_type as "structured" | "full" | "text",
    responseData: r.response_data,
    createdAt: r.created_at,
  }));
}

export async function insertAiHistory(
  db: SQLiteDatabase,
  data: {
    walletId: string | null;
    promptType: AiPromptType;
    year: number;
    month: number | null;
    responseType: string;
    responseData: string;
  },
): Promise<string> {
  const id = generateId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO ai_history (id, wallet_id, prompt_type, year, month, response_type, response_data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.walletId,
      data.promptType,
      data.year,
      data.month,
      data.responseType,
      data.responseData,
      createdAt,
    ],
  );
  return id;
}

export async function deleteAiHistory(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync("DELETE FROM ai_history WHERE id = ?", [id]);
}

async function migrateAiHistoryMonth(db: SQLiteDatabase) {
  const cols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(ai_history)",
  );
  if (!cols.some((c) => c.name === "month")) {
    await db.execAsync(
      "ALTER TABLE ai_history ADD COLUMN month INTEGER DEFAULT NULL",
    );
  }
}

async function migrateWalletSortOrder(db: SQLiteDatabase) {
  const cols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(wallets)",
  );
  if (!cols.some((c) => c.name === "sort_order")) {
    await db.execAsync(
      "ALTER TABLE wallets ADD COLUMN sort_order INTEGER DEFAULT 0",
    );
    // Set initial sort order based on existing created_at order
    const rows = await db.getAllAsync<{ id: string }>(
      "SELECT id FROM wallets ORDER BY created_at",
    );
    for (let i = 0; i < rows.length; i++) {
      await db.runAsync("UPDATE wallets SET sort_order = ? WHERE id = ?", [i, rows[i].id]);
    }
  }
}

// ===== Analysis Queries =====

// Fix 4 — upsertAnalysis: findAnalysisMatch + INSERT/UPDATE → single upsert
// Note: ON CONFLICT requires a UNIQUE index. Since analysis table uses a generated
// UUID as PK and doesn't have a natural unique constraint on the lookup columns,
// we keep the 2-step approach but use the optimized composite index from Fix 8.
export async function findAnalysisMatch(
  db: SQLiteDatabase,
  data: {
    walletId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    note?: string;
  },
): Promise<{ id: string; matchType: "basic" | "full"; count: number } | null> {
  if (data.note) {
    const full = await db.getFirstAsync<{ id: string; count: number }>(
      `SELECT id, count FROM analysis
       WHERE wallet_id = ? AND category_id = ? AND type = ? AND amount = ? AND note = ? AND match_type = 'full'`,
      [data.walletId, data.categoryId, data.type, data.amount, data.note],
    );
    if (full) return { id: full.id, matchType: "full", count: full.count };
  }

  const basic = await db.getFirstAsync<{ id: string; count: number }>(
    `SELECT id, count FROM analysis
     WHERE wallet_id = ? AND category_id = ? AND type = ? AND amount = ? AND match_type = 'basic'`,
    [data.walletId, data.categoryId, data.type, data.amount],
  );
  if (basic) return { id: basic.id, matchType: "basic", count: basic.count };
  return null;
}

export async function upsertAnalysis(
  db: SQLiteDatabase,
  data: {
    walletId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    note?: string;
    transactionId: string;
  },
  matchType: "basic" | "full",
): Promise<void> {
  const now = new Date().toISOString();
  const match = await findAnalysisMatch(db, data);
  if (match) {
    await db.runAsync(
      `UPDATE analysis SET count = count + 1, last_transaction_id = ?, updated_at = ? WHERE id = ?`,
      [data.transactionId, now, match.id],
    );
  } else {
    const id = generateId();
    await db.runAsync(
      `INSERT INTO analysis (id, wallet_id, type, category_id, amount, note, match_type, count, last_transaction_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        id,
        data.walletId,
        data.type,
        data.categoryId,
        data.amount,
        data.note ?? null,
        matchType,
        data.transactionId,
        now,
        now,
      ],
    );
  }
}

export async function getTopCategoryIdsByWallet(
  db: SQLiteDatabase,
  walletId: string,
  type: TransactionType,
  limit: number = 6,
): Promise<{ categoryId: string; total: number }[]> {
  const rows = await db.getAllAsync<{ category_id: string; total: number }>(
    `SELECT category_id, SUM(count) as total FROM analysis
     WHERE wallet_id = ? AND type = ?
     GROUP BY category_id
     ORDER BY total DESC
     LIMIT ?`,
    [walletId, type, limit],
  );
  return rows.map((r) => ({ categoryId: r.category_id, total: r.total }));
}

export async function getTopAnalysesByWallet(
  db: SQLiteDatabase,
  walletId: string,
  type: TransactionType,
  limit: number = 12,
): Promise<Analysis[]> {
  const rows = await db.getAllAsync<{
    id: string;
    wallet_id: string;
    type: string;
    category_id: string;
    amount: number;
    note: string | null;
    match_type: string;
    count: number;
    last_transaction_id: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT * FROM analysis
     WHERE wallet_id = ? AND type = ?
     ORDER BY count DESC, updated_at DESC
     LIMIT ?`,
    [walletId, type, limit],
  );

  return rows.map((r) => ({
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

/**
 * Frequent amounts — groups transactions by `amount` only (not note/category match).
 * Returns amounts that appear ≥ 2 times in the wallet, with category/note from
 * the most recent transaction having that amount. If `categoryId` is provided,
 * restricts grouping to that category.
 */
export async function getFrequentAmountsByWallet(
  db: SQLiteDatabase,
  walletId: string,
  type: TransactionType,
  limit: number = 12,
  categoryId?: string,
): Promise<Analysis[]> {
  const params: (string | number)[] = [walletId, type];
  let categoryFilter = "";
  if (categoryId) {
    categoryFilter = " AND category_id = ?";
    params.push(categoryId);
  }
  params.push(limit);

  const rows = await db.getAllAsync<{
    amount: number;
    category_id: string;
    note: string | null;
    last_transaction_id: string;
    dup_count: number;
    last_created_at: string;
  }>(
    `WITH ranked AS (
       SELECT
         amount, category_id, note, id, created_at,
         ROW_NUMBER() OVER (PARTITION BY amount ORDER BY created_at DESC) AS rn,
         COUNT(*)    OVER (PARTITION BY amount)                          AS dup_count
       FROM transactions
       WHERE wallet_id = ? AND type = ?${categoryFilter}
     )
     SELECT amount, category_id, note,
            id             AS last_transaction_id,
            dup_count      AS dup_count,
            created_at     AS last_created_at
     FROM ranked
     WHERE rn = 1 AND dup_count >= 2
     ORDER BY dup_count DESC, last_created_at DESC
     LIMIT ?`,
    params,
  );

  return rows.map((r) => ({
    id: `amt:${r.amount}:${r.last_transaction_id}`,
    walletId,
    type,
    categoryId: r.category_id,
    amount: r.amount,
    note: r.note ?? undefined,
    matchType: "basic" as MatchType,
    count: r.dup_count,
    lastTransactionId: r.last_transaction_id,
    createdAt: r.last_created_at,
    updatedAt: r.last_created_at,
  }));
}

export async function getTopAnalyses(
  db: SQLiteDatabase,
  limit: number = 6,
): Promise<Analysis[]> {
  const rows = await db.getAllAsync<{
    id: string;
    wallet_id: string;
    type: string;
    category_id: string;
    amount: number;
    note: string | null;
    match_type: string;
    count: number;
    last_transaction_id: string;
    created_at: string;
    updated_at: string;
  }>("SELECT * FROM analysis WHERE count >= 2 ORDER BY count DESC LIMIT ?", [
    limit,
  ]);

  return rows.map((r) => ({
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

export async function deleteAnalysisByWalletId(
  db: SQLiteDatabase,
  walletId: string,
): Promise<void> {
  await db.runAsync("DELETE FROM analysis WHERE wallet_id = ?", [walletId]);
}

export async function getDistinctNotesByCategory(
  db: SQLiteDatabase,
  categoryId: string,
  limit: number = 20,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ note: string }>(
    `SELECT DISTINCT note FROM transactions
     WHERE category_id = ? AND note IS NOT NULL AND note != ''
     ORDER BY created_at DESC
     LIMIT ?`,
    [categoryId, limit],
  );
  return rows.map((r) => r.note);
}
