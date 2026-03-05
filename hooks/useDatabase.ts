import { useCallback, useEffect, useState } from 'react';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from '@/db/migrations';

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
