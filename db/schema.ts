export const CREATE_CATEGORIES_TABLE = `
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

export const CREATE_TRANSACTIONS_TABLE = `
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

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);',
];
