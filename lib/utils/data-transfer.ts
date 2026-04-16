import { getDb } from '@/lib/stores/db';
import { generateId } from '@/lib/utils/id';
import type { Transaction } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';

// ─── Raw DB Types ───

interface RawWallet {
  id: string; name: string; type: string; icon: string; color: string;
  currency: string; initial_balance: number; current_balance: number;
  is_asset: number; created_at: string;
}

interface RawCategory {
  id: string; name: string; icon: string; color: string;
  type: string; is_custom: number; sort_order: number;
}

interface RawTransaction {
  id: string; type: string; amount: number; category_id: string;
  wallet_id: string; note: string | null; date: string; created_at: string;
}

interface RawAnalysis {
  id: string; wallet_id: string; type: string; category_id: string;
  amount: number; note: string | null; match_type: string;
  count: number; last_transaction_id: string;
  created_at: string; updated_at: string;
}

interface RawAiHistory {
  id: string; wallet_id: string | null; prompt_type: string;
  year: number; response_type: string; response_data: string;
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

// ─── Helpers ───

function emptyResult(error: string): ImportResult {
  return {
    success: false, wallets: 0, walletsRenamed: 0, categories: 0,
    transactions: 0, analysis: 0, aiHistory: 0, settingsRestored: false, error,
  };
}

async function queryAllData() {
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
  return {
    wallets, categories, transactions, analysis, aiHistory,
    settings: settingsRaw ? JSON.parse(settingsRaw) : null,
    alertSettings: alertSettingsRaw ? JSON.parse(alertSettingsRaw) : null,
    theme: theme ?? 'light',
  };
}

async function importParsedData(data: ExportData['data']): Promise<ImportResult> {
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
      // 1. Wallets
      const walletIdMap = new Map<string, string>();
      const existingWallets = await db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM wallets');
      const existingNames = new Set(existingWallets.map(w => w.name));

      for (const w of data.wallets ?? []) {
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

      // 2. Categories
      const categoryIdMap = new Map<string, string>();
      const existingCatIds = new Set(
        (await db.getAllAsync<{ id: string }>('SELECT id FROM categories')).map(c => c.id),
      );
      for (const c of data.categories ?? []) {
        if (existingCatIds.has(c.id)) { categoryIdMap.set(c.id, c.id); continue; }
        if (c.is_custom !== 1) { categoryIdMap.set(c.id, c.id); continue; }
        const newId = generateId();
        categoryIdMap.set(c.id, newId);
        await db.runAsync(
          `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, c.name, c.icon, c.color, c.type, c.is_custom, c.sort_order],
        );
        categoriesImported++;
      }

      // 3. Transactions
      for (const t of data.transactions ?? []) {
        const newId = generateId();
        const walletId = walletIdMap.get(t.wallet_id) ?? t.wallet_id ?? 'wallet-cash';
        const categoryId = categoryIdMap.get(t.category_id) ?? t.category_id;
        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at, wallet_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, t.type, t.amount, categoryId, t.note, t.date, t.created_at, walletId],
        );
        transactionsImported++;
      }

      // 4. Analysis
      for (const a of data.analysis ?? []) {
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
      for (const h of data.aiHistory ?? []) {
        const newId = generateId();
        const walletId = h.wallet_id ? (walletIdMap.get(h.wallet_id) ?? h.wallet_id) : null;
        await db.runAsync(
          `INSERT INTO ai_history (id, wallet_id, prompt_type, year, response_type, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, walletId, h.prompt_type, h.year, h.response_type, h.response_data, h.created_at],
        );
        aiHistoryImported++;
      }
    });

    // 6. AsyncStorage settings
    if (data.settings) {
      await AsyncStorage.setItem('app_settings', JSON.stringify(data.settings));
      settingsRestored = true;
    }
    if (data.alertSettings) {
      await AsyncStorage.setItem('alert_settings', JSON.stringify(data.alertSettings));
    }
    if (data.theme) {
      await AsyncStorage.setItem('app_theme', data.theme);
    }

    return {
      success: true, wallets: walletsImported, walletsRenamed,
      categories: categoriesImported, transactions: transactionsImported,
      analysis: analysisImported, aiHistory: aiHistoryImported, settingsRestored,
    };
  } catch (e: unknown) {
    return emptyResult(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
  }
}

// ─── Counts ───

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
    wallets: wallets?.c ?? 0, categories: categories?.c ?? 0,
    transactions: transactions?.c ?? 0, analysis: analysis?.c ?? 0,
    aiHistory: aiHistory?.c ?? 0,
    hasSettings: !!settings, hasAlertSettings: !!alertSettings,
  };
}

// ─── Export TXT (JSON) ───

export async function exportAllData(): Promise<void> {
  const allData = await queryAllData();
  const exportData: ExportData = {
    version: 1, exportedAt: new Date().toISOString(), app: 'CeasFlow', data: allData,
  };
  const json = JSON.stringify(exportData, null, 2);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = new File(Paths.document, `ceasflow_backup_${ts}.txt`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain', dialogTitle: 'ส่งออกข้อมูล CeasFlow', UTI: 'public.plain-text',
  });
}

// ─── Import TXT (JSON) ───

export async function pickAndImportData(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'text/plain', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return emptyResult('ยกเลิกการเลือกไฟล์');

  const file = new File(result.assets[0].uri);
  const content = await file.text();

  let parsed: ExportData;
  try { parsed = JSON.parse(content); } catch { return emptyResult('ไฟล์ไม่ถูกต้อง ไม่สามารถอ่านข้อมูล JSON ได้'); }
  if (parsed.app !== 'CeasFlow' || !parsed.data) return emptyResult('ไฟล์นี้ไม่ใช่ข้อมูลที่ส่งออกจาก CeasFlow');

  return importParsedData(parsed.data);
}

// ─── Export Excel (full data) ───

export async function exportAllDataExcel(): Promise<void> {
  const allData = await queryAllData();
  const workbook = new ExcelJS.Workbook();

  // Meta sheet
  const meta = workbook.addWorksheet('meta');
  meta.columns = [
    { header: 'key', key: 'key', width: 20 },
    { header: 'value', key: 'value', width: 40 },
  ];
  meta.addRow({ key: 'app', value: 'CeasFlow' });
  meta.addRow({ key: 'version', value: '1' });
  meta.addRow({ key: 'exportedAt', value: new Date().toISOString() });

  // Wallets sheet
  const ws = workbook.addWorksheet('wallets');
  ws.columns = [
    { header: 'id', key: 'id', width: 20 }, { header: 'name', key: 'name', width: 15 },
    { header: 'type', key: 'type', width: 12 }, { header: 'icon', key: 'icon', width: 18 },
    { header: 'color', key: 'color', width: 10 }, { header: 'currency', key: 'currency', width: 8 },
    { header: 'initial_balance', key: 'initial_balance', width: 15 },
    { header: 'current_balance', key: 'current_balance', width: 15 },
    { header: 'is_asset', key: 'is_asset', width: 8 }, { header: 'created_at', key: 'created_at', width: 22 },
  ];
  for (const w of allData.wallets) ws.addRow(w);

  // Categories sheet
  const cs = workbook.addWorksheet('categories');
  cs.columns = [
    { header: 'id', key: 'id', width: 20 }, { header: 'name', key: 'name', width: 15 },
    { header: 'icon', key: 'icon', width: 18 }, { header: 'color', key: 'color', width: 10 },
    { header: 'type', key: 'type', width: 10 }, { header: 'is_custom', key: 'is_custom', width: 10 },
    { header: 'sort_order', key: 'sort_order', width: 10 },
  ];
  for (const c of allData.categories) cs.addRow(c);

  // Transactions sheet
  const ts2 = workbook.addWorksheet('transactions');
  ts2.columns = [
    { header: 'id', key: 'id', width: 20 }, { header: 'type', key: 'type', width: 10 },
    { header: 'amount', key: 'amount', width: 12 }, { header: 'category_id', key: 'category_id', width: 20 },
    { header: 'wallet_id', key: 'wallet_id', width: 20 }, { header: 'note', key: 'note', width: 25 },
    { header: 'date', key: 'date', width: 12 }, { header: 'created_at', key: 'created_at', width: 22 },
  ];
  for (const t of allData.transactions) ts2.addRow(t);

  // Analysis sheet
  const as2 = workbook.addWorksheet('analysis');
  as2.columns = [
    { header: 'id', key: 'id', width: 20 }, { header: 'wallet_id', key: 'wallet_id', width: 20 },
    { header: 'type', key: 'type', width: 10 }, { header: 'category_id', key: 'category_id', width: 20 },
    { header: 'amount', key: 'amount', width: 12 }, { header: 'note', key: 'note', width: 20 },
    { header: 'match_type', key: 'match_type', width: 10 }, { header: 'count', key: 'count', width: 8 },
    { header: 'last_transaction_id', key: 'last_transaction_id', width: 20 },
    { header: 'created_at', key: 'created_at', width: 22 }, { header: 'updated_at', key: 'updated_at', width: 22 },
  ];
  for (const a of allData.analysis) as2.addRow(a);

  // AI History sheet
  const ah = workbook.addWorksheet('ai_history');
  ah.columns = [
    { header: 'id', key: 'id', width: 20 }, { header: 'wallet_id', key: 'wallet_id', width: 20 },
    { header: 'prompt_type', key: 'prompt_type', width: 15 }, { header: 'year', key: 'year', width: 8 },
    { header: 'response_type', key: 'response_type', width: 12 },
    { header: 'response_data', key: 'response_data', width: 40 },
    { header: 'created_at', key: 'created_at', width: 22 },
  ];
  for (const h of allData.aiHistory) ah.addRow(h);

  // Settings sheet
  const ss = workbook.addWorksheet('settings');
  ss.columns = [
    { header: 'key', key: 'key', width: 20 },
    { header: 'value', key: 'value', width: 60 },
  ];
  if (allData.settings) ss.addRow({ key: 'app_settings', value: JSON.stringify(allData.settings) });
  if (allData.alertSettings) ss.addRow({ key: 'alert_settings', value: JSON.stringify(allData.alertSettings) });
  ss.addRow({ key: 'app_theme', value: allData.theme });

  // Write file
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);

  const fileName = `ceasflow_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`;
  const file = new File(Paths.document, fileName);
  if (file.exists) file.delete();
  file.create();
  const handle = file.open();
  handle.writeBytes(bytes);
  handle.close();

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ─── Import Excel (full data) ───

export async function pickAndImportDataExcel(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return emptyResult('ยกเลิกการเลือกไฟล์');

  const file = new File(result.assets[0].uri);
  const base64 = await file.base64();
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes.buffer);

  // Validate meta
  const metaSheet = workbook.getWorksheet('meta');
  if (!metaSheet) return emptyResult('ไฟล์ Excel ไม่ถูกต้อง ไม่พบ sheet "meta"');

  let appName = '';
  metaSheet.eachRow((row: any) => {
    if (String(row.getCell(1).value) === 'app') appName = String(row.getCell(2).value);
  });
  if (appName !== 'CeasFlow') return emptyResult('ไฟล์นี้ไม่ใช่ข้อมูลที่ส่งออกจาก CeasFlow');

  // Parse sheets
  const parseSheet = <T>(name: string): T[] => {
    const sheet = workbook.getWorksheet(name);
    if (!sheet) return [];
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell: any, col: number) => { headers[col] = String(cell.value ?? ''); });
    const rows: T[] = [];
    sheet.eachRow((row: any, rowNum: number) => {
      if (rowNum === 1) return;
      const obj: Record<string, any> = {};
      row.eachCell((cell: any, col: number) => { obj[headers[col]] = cell.value; });
      rows.push(obj as T);
    });
    return rows;
  };

  const wallets = parseSheet<RawWallet>('wallets');
  const categories = parseSheet<RawCategory>('categories');
  const transactions = parseSheet<RawTransaction>('transactions');
  const analysis = parseSheet<RawAnalysis>('analysis');
  const aiHistory = parseSheet<RawAiHistory>('ai_history');

  // Parse settings
  let settings: Record<string, unknown> | null = null;
  let alertSettings: Record<string, unknown> | null = null;
  let theme = 'light';
  const settingsSheet = workbook.getWorksheet('settings');
  if (settingsSheet) {
    settingsSheet.eachRow((row: any, rowNum: number) => {
      if (rowNum === 1) return;
      const key = String(row.getCell(1).value ?? '');
      const val = String(row.getCell(2).value ?? '');
      if (key === 'app_settings') try { settings = JSON.parse(val); } catch {}
      if (key === 'alert_settings') try { alertSettings = JSON.parse(val); } catch {}
      if (key === 'app_theme') theme = val;
    });
  }

  return importParsedData({ wallets, categories, transactions, analysis, aiHistory, settings, alertSettings, theme });
}

// ─── CSV Export (transaction-only, used by analytics) ───

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportToCSV(transactions: Transaction[]) {
  const BOM = '\uFEFF';
  const header = 'วันที่,ประเภท,หมวดหมู่,จำนวนเงิน,หมายเหตุ';
  const rows = transactions.map(t =>
    [
      t.date,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      escapeCSV(t.category?.name ?? ''),
      t.amount.toString(),
      escapeCSV(t.note || ''),
    ].join(',')
  );

  const csv = BOM + [header, ...rows].join('\n');
  const csvFile = new File(Paths.document, `expense_${Date.now()}.csv`);
  if (csvFile.exists) csvFile.delete();
  csvFile.create();
  csvFile.write(csv);
  await Sharing.shareAsync(csvFile.uri, {
    mimeType: 'text/csv', UTI: 'public.comma-separated-values-text',
  });
}
