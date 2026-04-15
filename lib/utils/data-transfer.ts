import { getDb } from '@/lib/stores/db';
import { generateId } from '@/lib/utils/id';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';

interface RawWallet {
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
}

interface RawCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  is_custom: number;
  sort_order: number;
}

interface RawTransaction {
  id: string;
  type: string;
  amount: number;
  category_id: string;
  wallet_id: string;
  note: string | null;
  date: string;
  created_at: string;
}

interface RawAnalysis {
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
}

interface RawAiHistory {
  id: string;
  wallet_id: string | null;
  prompt_type: string;
  year: number;
  response_type: string;
  response_data: string;
  created_at: string;
}

interface ExportData {
  version: number;
  exportedAt: string;
  app: string;
  data: {
    wallets: RawWallet[];
    categories: RawCategory[];
    transactions: RawTransaction[];
    analysis: RawAnalysis[];
    aiHistory: RawAiHistory[];
    settings: Record<string, unknown> | null;
    alertSettings: Record<string, unknown> | null;
    theme: string;
  };
}

export interface ExportCounts {
  wallets: number;
  categories: number;
  transactions: number;
  analysis: number;
  aiHistory: number;
  hasSettings: boolean;
  hasAlertSettings: boolean;
}

export interface ImportResult {
  success: boolean;
  wallets: number;
  walletsRenamed: number;
  categories: number;
  transactions: number;
  analysis: number;
  aiHistory: number;
  settingsRestored: boolean;
  error?: string;
}

// ─── Export ───

export async function getExportCounts(): Promise<ExportCounts> {
  const db = getDb();
  const [wallets, categories, transactions, analysis, aiHistory] = await Promise.all([
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM wallets'),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM categories'),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM transactions'),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM analysis'),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM ai_history'),
  ]);
  const [settings, alertSettings] = await Promise.all([
    AsyncStorage.getItem('app_settings'),
    AsyncStorage.getItem('alert_settings'),
  ]);

  return {
    wallets: wallets?.c ?? 0,
    categories: categories?.c ?? 0,
    transactions: transactions?.c ?? 0,
    analysis: analysis?.c ?? 0,
    aiHistory: aiHistory?.c ?? 0,
    hasSettings: !!settings,
    hasAlertSettings: !!alertSettings,
  };
}

export async function exportAllData(): Promise<void> {
  const db = getDb();

  const [wallets, categories, transactions, analysis, aiHistory] = await Promise.all([
    db.getAllAsync<RawWallet>('SELECT * FROM wallets ORDER BY created_at'),
    db.getAllAsync<RawCategory>('SELECT * FROM categories ORDER BY type, sort_order'),
    db.getAllAsync<RawTransaction>('SELECT * FROM transactions ORDER BY date DESC, created_at DESC'),
    db.getAllAsync<RawAnalysis>('SELECT * FROM analysis ORDER BY updated_at DESC'),
    db.getAllAsync<RawAiHistory>('SELECT * FROM ai_history ORDER BY created_at DESC'),
  ]);

  const [settingsRaw, alertSettingsRaw, theme] = await Promise.all([
    AsyncStorage.getItem('app_settings'),
    AsyncStorage.getItem('alert_settings'),
    AsyncStorage.getItem('app_theme'),
  ]);

  const exportData: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'CeasFlow',
    data: {
      wallets,
      categories,
      transactions,
      analysis,
      aiHistory,
      settings: settingsRaw ? JSON.parse(settingsRaw) : null,
      alertSettings: alertSettingsRaw ? JSON.parse(alertSettingsRaw) : null,
      theme: theme ?? 'light',
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = new File(Paths.document, `ceasflow_backup_${ts}.txt`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    dialogTitle: 'ส่งออกข้อมูล CeasFlow',
    UTI: 'public.plain-text',
  });
}

// ─── Import ───

export async function pickAndImportData(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'text/plain',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) {
    return emptyResult('ยกเลิกการเลือกไฟล์');
  }

  const file = new File(result.assets[0].uri);
  const content = await file.text();
  return importData(content);
}

async function importData(jsonString: string): Promise<ImportResult> {
  let parsed: ExportData;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return emptyResult('ไฟล์ไม่ถูกต้อง ไม่สามารถอ่านข้อมูล JSON ได้');
  }

  if (parsed.app !== 'CeasFlow' || !parsed.data) {
    return emptyResult('ไฟล์นี้ไม่ใช่ข้อมูลที่ส่งออกจาก CeasFlow');
  }

  const db = getDb();
  let walletsImported = 0;
  let walletsRenamed = 0;
  let categoriesImported = 0;
  let transactionsImported = 0;
  let analysisImported = 0;
  let aiHistoryImported = 0;
  let settingsRestored = false;

  try {
    await db.withTransactionAsync(async () => {
      // 1. Wallets — rename on name collision
      const walletIdMap = new Map<string, string>();
      const existingWallets = await db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM wallets');
      const existingNames = new Set(existingWallets.map(w => w.name));

      for (const w of parsed.data.wallets ?? []) {
        let name = w.name;
        if (existingNames.has(name)) {
          let suffix = 2;
          while (existingNames.has(`${w.name} (${suffix})`)) suffix++;
          name = `${w.name} (${suffix})`;
          walletsRenamed++;
        }

        const newId = generateId();
        walletIdMap.set(w.id, newId);
        existingNames.add(name);

        await db.runAsync(
          `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, name, w.type, w.icon, w.color, w.currency ?? 'THB', w.initial_balance ?? 0, w.current_balance ?? 0, w.is_asset ?? 1, w.created_at ?? new Date().toISOString()],
        );
        walletsImported++;
      }

      // 2. Categories — skip existing IDs, only insert new custom categories
      const categoryIdMap = new Map<string, string>();
      const existingCatIds = new Set(
        (await db.getAllAsync<{ id: string }>('SELECT id FROM categories')).map(c => c.id),
      );

      for (const c of parsed.data.categories ?? []) {
        if (existingCatIds.has(c.id)) {
          categoryIdMap.set(c.id, c.id);
          continue;
        }
        if (c.is_custom !== 1) {
          categoryIdMap.set(c.id, c.id);
          continue;
        }
        const newId = generateId();
        categoryIdMap.set(c.id, newId);
        await db.runAsync(
          `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, c.name, c.icon, c.color, c.type, c.is_custom, c.sort_order],
        );
        categoriesImported++;
      }

      // 3. Transactions
      for (const t of parsed.data.transactions ?? []) {
        const newId = generateId();
        const walletId = walletIdMap.get(t.wallet_id) ?? t.wallet_id ?? 'wallet-cash';
        const categoryId = categoryIdMap.get(t.category_id) ?? t.category_id;
        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at, wallet_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, t.type, t.amount, categoryId, t.note, t.date, t.created_at, walletId],
        );
        transactionsImported++;
      }

      // 4. Analysis
      for (const a of parsed.data.analysis ?? []) {
        const newId = generateId();
        const walletId = walletIdMap.get(a.wallet_id) ?? a.wallet_id;
        const categoryId = categoryIdMap.get(a.category_id) ?? a.category_id;
        await db.runAsync(
          `INSERT INTO analysis (id, wallet_id, type, category_id, amount, note, match_type, count, last_transaction_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, walletId, a.type, categoryId, a.amount, a.note, a.match_type, a.count, a.last_transaction_id ?? '', a.created_at, a.updated_at],
        );
        analysisImported++;
      }

      // 5. AI History
      for (const h of parsed.data.aiHistory ?? []) {
        const newId = generateId();
        const walletId = h.wallet_id ? (walletIdMap.get(h.wallet_id) ?? h.wallet_id) : null;
        await db.runAsync(
          `INSERT INTO ai_history (id, wallet_id, prompt_type, year, response_type, response_data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, walletId, h.prompt_type, h.year, h.response_type, h.response_data, h.created_at],
        );
        aiHistoryImported++;
      }
    });

    // 6. AsyncStorage settings (outside DB transaction)
    if (parsed.data.settings) {
      await AsyncStorage.setItem('app_settings', JSON.stringify(parsed.data.settings));
      settingsRestored = true;
    }
    if (parsed.data.alertSettings) {
      await AsyncStorage.setItem('alert_settings', JSON.stringify(parsed.data.alertSettings));
    }
    if (parsed.data.theme) {
      await AsyncStorage.setItem('app_theme', parsed.data.theme);
    }

    return {
      success: true,
      wallets: walletsImported,
      walletsRenamed,
      categories: categoriesImported,
      transactions: transactionsImported,
      analysis: analysisImported,
      aiHistory: aiHistoryImported,
      settingsRestored,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล';
    return emptyResult(msg);
  }
}

function emptyResult(error: string): ImportResult {
  return {
    success: false,
    wallets: 0,
    walletsRenamed: 0,
    categories: 0,
    transactions: 0,
    analysis: 0,
    aiHistory: 0,
    settingsRestored: false,
    error,
  };
}
