import { getDb, insertTransaction, upsertAnalysis } from '@/lib/stores/db';
import { generateId } from '@/lib/utils/id';
import type { Transaction, TransactionType, WalletType } from '@/types';
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
  /** Final wallet names actually inserted (with rename suffix applied). */
  walletNames: string[];
  categories: number;
  transactions: number;
  analysis: number;
  aiHistory: number;
  settingsRestored: boolean;
  error?: string;
}

export type ImportPhase = 'wallets' | 'categories' | 'transactions' | 'analysis' | 'aiHistory';

export interface ImportProgress {
  /** Items processed so far across all phases. */
  current: number;
  /** Total items to process across all phases. */
  total: number;
  /** Current phase. */
  phase: ImportPhase;
  /** Per-phase counter — useful for "ธุรกรรม 12/45" UI. */
  phaseCurrent: number;
  phaseTotal: number;
}

export type ImportProgressCallback = (progress: ImportProgress) => void;

// ─── Helpers ───

function emptyResult(error: string): ImportResult {
  return {
    success: false, wallets: 0, walletsRenamed: 0, walletNames: [], categories: 0,
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

async function importParsedData(data: ExportData['data'], onProgress?: ImportProgressCallback): Promise<ImportResult> {
  const db = getDb();
  let walletsImported = 0;
  let walletsRenamed = 0;
  const walletNames: string[] = [];
  let categoriesImported = 0;
  let transactionsImported = 0;
  let analysisImported = 0;
  let aiHistoryImported = 0;
  let settingsRestored = false;

  // Total items across all phases — used for the overall progress bar.
  const wTotal = (data.wallets ?? []).length;
  const cTotal = (data.categories ?? []).length;
  const tTotal = (data.transactions ?? []).length;
  const aTotal = (data.analysis ?? []).length;
  const hTotal = (data.aiHistory ?? []).length;
  const grandTotal = wTotal + cTotal + tTotal + aTotal + hTotal;
  let cursor = 0;
  const tick = (phase: ImportPhase, phaseCurrent: number, phaseTotal: number) => {
    if (!onProgress) return;
    onProgress({ current: cursor, total: grandTotal, phase, phaseCurrent, phaseTotal });
  };

  // Drain any lingering transaction left behind by a prior interrupted
  // operation. ROLLBACK errors silently if no transaction is active.
  await db.execAsync('ROLLBACK').catch(() => {});

  try {
    await db.withTransactionAsync(async () => {
      // 1. Wallets
      tick('wallets', 0, wTotal);
      const walletIdMap = new Map<string, string>();
      const existingWallets = await db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM wallets');
      const existingNames = new Set(existingWallets.map(w => w.name));

      let wIdx = 0;
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
        walletNames.push(name);
        walletsImported++;
        cursor++; wIdx++;
        tick('wallets', wIdx, wTotal);
      }

      // 2. Categories
      tick('categories', 0, cTotal);
      const categoryIdMap = new Map<string, string>();
      const existingCatIds = new Set(
        (await db.getAllAsync<{ id: string }>('SELECT id FROM categories')).map(c => c.id),
      );
      let cIdx = 0;
      for (const c of data.categories ?? []) {
        if (existingCatIds.has(c.id)) { categoryIdMap.set(c.id, c.id); cursor++; cIdx++; tick('categories', cIdx, cTotal); continue; }
        if (c.is_custom !== 1) { categoryIdMap.set(c.id, c.id); cursor++; cIdx++; tick('categories', cIdx, cTotal); continue; }
        const newId = generateId();
        categoryIdMap.set(c.id, newId);
        await db.runAsync(
          `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, c.name, c.icon, c.color, c.type, c.is_custom, c.sort_order],
        );
        categoriesImported++;
        cursor++; cIdx++;
        tick('categories', cIdx, cTotal);
      }

      // 3. Transactions
      tick('transactions', 0, tTotal);
      let tIdx = 0;
      for (const t of data.transactions ?? []) {
        const newId = generateId();
        const walletId = walletIdMap.get(t.wallet_id) ?? t.wallet_id ?? 'wallet-cash';
        const categoryId = categoryIdMap.get(t.category_id) ?? t.category_id;
        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at, wallet_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, t.type, t.amount, categoryId, t.note, t.date, t.created_at, walletId],
        );
        transactionsImported++;
        cursor++; tIdx++;
        tick('transactions', tIdx, tTotal);
      }

      // 4. Analysis
      tick('analysis', 0, aTotal);
      let aIdx = 0;
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
        cursor++; aIdx++;
        tick('analysis', aIdx, aTotal);
      }

      // 5. AI History
      tick('aiHistory', 0, hTotal);
      let hIdx = 0;
      for (const h of data.aiHistory ?? []) {
        const newId = generateId();
        const walletId = h.wallet_id ? (walletIdMap.get(h.wallet_id) ?? h.wallet_id) : null;
        await db.runAsync(
          `INSERT INTO ai_history (id, wallet_id, prompt_type, year, response_type, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, walletId, h.prompt_type, h.year, h.response_type, h.response_data, h.created_at],
        );
        aiHistoryImported++;
        cursor++; hIdx++;
        tick('aiHistory', hIdx, hTotal);
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
      success: true, wallets: walletsImported, walletsRenamed, walletNames,
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

export async function pickAndImportData(onProgress?: ImportProgressCallback): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'text/plain', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return emptyResult('ยกเลิกการเลือกไฟล์');

  const file = new File(result.assets[0].uri);
  const content = await file.text();

  let parsed: ExportData;
  try { parsed = JSON.parse(content); } catch { return emptyResult('ไฟล์ไม่ถูกต้อง ไม่สามารถอ่านข้อมูล JSON ได้'); }
  if (parsed.app !== 'CeasFlow' || !parsed.data) return emptyResult('ไฟล์นี้ไม่ใช่ข้อมูลที่ส่งออกจาก CeasFlow');

  return importParsedData(parsed.data, onProgress);
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

export async function pickAndImportDataExcel(onProgress?: ImportProgressCallback): Promise<ImportResult> {
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

  return importParsedData({ wallets, categories, transactions, analysis, aiHistory, settings, alertSettings, theme }, onProgress);
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

// ─── Special Import (Pay Flow human-readable .txt) ───
//
// Parses files in the format:
//   [ กระเป๋าเงิน ]   → wallets (TSV: name, type, init, current)
//   [ หมวดหมู่ ]      → categories (emoji + name, grouped by รายรับ/รายจ่าย)
//   [ รายการธุรกรรม ] → transactions (TSV: date, type, category, amount, note),
//                       grouped by wallet via "── walletName (N รายการ) ──"
//
// Categories are matched by name+type to existing ones; unmatched become
// custom categories with the source emoji stored as the icon.

const THAI_MONTH_ABBR_MAP: Record<string, number> = {
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
  'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
};

const WALLET_TYPE_MAP: Record<string, WalletType> = {
  'เงินสด': 'cash',
  'ธนาคาร': 'bank',
  'บัญชีธนาคาร': 'bank',
  'บัตรเครดิต': 'credit_card',
  'อีวอลเล็ท': 'e_wallet',
  'อี-วอลเล็ท': 'e_wallet',
  'E-Wallet': 'e_wallet',
  'ออมทรัพย์': 'savings',
  'เงินออม': 'savings',
  'ใช้จ่ายประจำวัน': 'daily_expense',
};

interface ParsedSpecialWallet {
  name: string;
  type: WalletType;
  initialBalance: number;
  currentBalance: number;
}
interface ParsedSpecialCategory {
  name: string;
  icon: string;
  type: TransactionType;
}
interface ParsedSpecialTransaction {
  walletName: string;
  date: string;
  createdAt: string;
  type: TransactionType;
  categoryName: string;
  amount: number;
  note?: string;
}
interface ParsedSpecialData {
  wallets: ParsedSpecialWallet[];
  categories: ParsedSpecialCategory[];
  transactions: ParsedSpecialTransaction[];
}

function parseThaiDateTime(s: string): { date: string; createdAt: string } | null {
  // "22 มี.ค. 2569 17:43" → date "2026-03-22", ISO "2026-03-22T17:43:00.000Z"
  const m = s.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = THAI_MONTH_ABBR_MAP[m[2]];
  if (!month) return null;
  const year = parseInt(m[3], 10) - 543;
  const hour = parseInt(m[4] ?? '0', 10);
  const minute = parseInt(m[5] ?? '0', 10);
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const createdAt = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
  return { date, createdAt };
}

function parsePayFlowText(content: string): ParsedSpecialData | null {
  const lines = content.split(/\r?\n/);

  const wallets: ParsedSpecialWallet[] = [];
  const categories: ParsedSpecialCategory[] = [];
  const transactions: ParsedSpecialTransaction[] = [];

  type Section = 'none' | 'wallet' | 'category' | 'transaction';
  let section: Section = 'none';
  let walletHeaderSeen = false;
  let categoryType: TransactionType | null = null;
  let currentWalletName: string | null = null;
  let txHeaderSeen = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Section headers
    if (trimmed.startsWith('[ กระเป๋าเงิน ]')) {
      section = 'wallet';
      walletHeaderSeen = false;
      continue;
    }
    if (trimmed.startsWith('[ หมวดหมู่ ]')) {
      section = 'category';
      categoryType = null;
      continue;
    }
    if (trimmed.startsWith('[ รายการธุรกรรม')) {
      section = 'transaction';
      currentWalletName = null;
      txHeaderSeen = false;
      continue;
    }
    if (trimmed.startsWith('[')) {
      section = 'none';
      continue;
    }

    if (!trimmed) continue;
    // Pure divider lines
    if (/^[─═]+$/.test(trimmed)) continue;

    if (section === 'wallet') {
      if (trimmed.includes('ชื่อกระเป๋า')) { walletHeaderSeen = true; continue; }
      if (/^[─\t\s]+$/.test(line)) continue;
      if (!walletHeaderSeen) continue;
      const parts = line.split('\t').map(p => p.trim());
      if (parts.length < 2 || !parts[0]) continue;
      const [name, typeStr, initStr, currStr] = parts;
      const type = WALLET_TYPE_MAP[typeStr ?? ''] ?? 'cash';
      const initialBalance = parseFloat((initStr ?? '0').replace(/,/g, '')) || 0;
      const currentBalance = parseFloat((currStr ?? '0').replace(/,/g, '')) || 0;
      wallets.push({ name, type, initialBalance, currentBalance });
      continue;
    }

    if (section === 'category') {
      if (trimmed === 'รายรับ:') { categoryType = 'income'; continue; }
      if (trimmed === 'รายจ่าย:') { categoryType = 'expense'; continue; }
      if (!categoryType) continue;
      // "💰 เงินเดือน" — first whitespace-separated token is the emoji
      const m = trimmed.match(/^(\S+)\s+(.+)$/);
      if (!m) continue;
      const icon = m[1];
      const name = m[2].trim();
      if (!name) continue;
      categories.push({ name, icon, type: categoryType });
      continue;
    }

    if (section === 'transaction') {
      // Wallet sub-header: "── เงินใช้ (257 รายการ) ──"
      const walletMatch = trimmed.match(/^──\s*(.+?)\s*\(\s*\d+\s*รายการ\s*\)\s*──$/);
      if (walletMatch) {
        currentWalletName = walletMatch[1].trim();
        txHeaderSeen = false;
        continue;
      }
      if (trimmed.startsWith('รายรับ:') || trimmed.startsWith('รายจ่าย:')) continue;
      if (trimmed.startsWith('วันที่')) { txHeaderSeen = true; continue; }
      if (!txHeaderSeen || !currentWalletName) continue;

      const parts = line.split('\t').map(p => p.trim());
      if (parts.length < 4) continue;
      const [dateStr, typeStr, categoryName, amountStr, noteStr] = parts;
      const dt = parseThaiDateTime(dateStr);
      if (!dt) continue;
      const type: TransactionType = typeStr === 'รายรับ' ? 'income' : 'expense';
      const amount = Math.abs(parseFloat((amountStr ?? '0').replace(/[+,\s]/g, ''))) || 0;
      if (!amount) continue;
      const note = noteStr && noteStr !== '-' ? noteStr : undefined;
      transactions.push({
        walletName: currentWalletName,
        date: dt.date,
        createdAt: dt.createdAt,
        type,
        categoryName,
        amount,
        note,
      });
    }
  }

  if (wallets.length === 0 && categories.length === 0 && transactions.length === 0) return null;
  return { wallets, categories, transactions };
}

const DEFAULT_CUSTOM_COLORS: Record<TransactionType, string> = {
  income: '#3E8B68',
  expense: '#F5A185',
};

async function importParsedSpecialData(parsed: ParsedSpecialData, onProgress?: ImportProgressCallback): Promise<ImportResult> {
  const db = getDb();
  let walletsImported = 0;
  let walletsRenamed = 0;
  const walletNames: string[] = [];
  let categoriesImported = 0;
  let transactionsImported = 0;
  let analysisImported = 0;

  const wTotal = parsed.wallets.length;
  const cTotal = parsed.categories.length;
  const tTotal = parsed.transactions.length;
  const grandTotal = wTotal + cTotal + tTotal;
  let cursor = 0;
  const tick = (phase: ImportPhase, phaseCurrent: number, phaseTotal: number) => {
    if (!onProgress) return;
    onProgress({ current: cursor, total: grandTotal, phase, phaseCurrent, phaseTotal });
  };

  // Drain any lingering transaction left behind by a prior interrupted
  // operation. ROLLBACK errors silently if no transaction is active.
  await db.execAsync('ROLLBACK').catch(() => {});

  try {
    await db.withTransactionAsync(async () => {
      // 1. Wallets — match by name, otherwise create (rename on collision)
      tick('wallets', 0, wTotal);
      const existingWallets = await db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM wallets');
      const walletNameToId = new Map<string, string>();
      const existingNames = new Set<string>();
      for (const w of existingWallets) {
        walletNameToId.set(w.name, w.id);
        existingNames.add(w.name);
      }

      let wIdx = 0;
      for (const w of parsed.wallets) {
        if (walletNameToId.has(w.name)) { cursor++; wIdx++; tick('wallets', wIdx, wTotal); continue; }
        let name = w.name;
        if (existingNames.has(name)) {
          let suffix = 2;
          while (existingNames.has(`${w.name} (${suffix})`)) suffix++;
          name = `${w.name} (${suffix})`;
          walletsRenamed++;
        }
        const newId = generateId();
        existingNames.add(name);
        walletNameToId.set(w.name, newId);
        await db.runAsync(
          `INSERT INTO wallets (id, name, type, icon, color, currency, initial_balance, current_balance, is_asset, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, name, w.type, 'cash-outline', '#22C55E', 'THB', w.initialBalance, w.currentBalance, 1, new Date().toISOString()],
        );
        walletNames.push(name);
        walletsImported++;
        cursor++; wIdx++;
        tick('wallets', wIdx, wTotal);
      }

      // 2. Categories — match existing by (type|name), otherwise create custom
      const existingCats = await db.getAllAsync<{ id: string; name: string; type: string }>('SELECT id, name, type FROM categories');
      const catKeyToId = new Map<string, string>();
      for (const c of existingCats) catKeyToId.set(`${c.type}|${c.name}`, c.id);

      const maxIncSort = (await db.getFirstAsync<{ m: number | null }>(
        "SELECT MAX(sort_order) as m FROM categories WHERE type = 'income'",
      ))?.m ?? -1;
      const maxExpSort = (await db.getFirstAsync<{ m: number | null }>(
        "SELECT MAX(sort_order) as m FROM categories WHERE type = 'expense'",
      ))?.m ?? -1;
      let incSort = maxIncSort + 1;
      let expSort = maxExpSort + 1;

      const ensureCategory = async (
        name: string,
        type: TransactionType,
        icon: string | null,
      ): Promise<string> => {
        const key = `${type}|${name}`;
        const existing = catKeyToId.get(key);
        if (existing) return existing;
        const id = generateId();
        catKeyToId.set(key, id);
        const sortOrder = type === 'income' ? incSort++ : expSort++;
        await db.runAsync(
          `INSERT INTO categories (id, name, icon, color, type, is_custom, sort_order)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [id, name, icon || 'ellipsis-horizontal', DEFAULT_CUSTOM_COLORS[type], type, sortOrder],
        );
        categoriesImported++;
        return id;
      };

      tick('categories', 0, cTotal);
      let cIdx = 0;
      for (const c of parsed.categories) {
        await ensureCategory(c.name, c.type, c.icon);
        cursor++; cIdx++;
        tick('categories', cIdx, cTotal);
      }

      // 3. Transactions — fall back to first known wallet if name unknown
      const fallbackWalletId =
        walletNameToId.values().next().value ??
        existingWallets[0]?.id ??
        'wallet-cash';

      // Track which (wallet, type, category, amount, note) combos already had
      // analysis rows before this import — we count newly-created rows for the
      // result. Existing rows just get their `count` incremented.
      const seenAnalysisKeys = new Set<string>();
      const analysisKey = (
        walletId: string, type: TransactionType, categoryId: string,
        amount: number, note: string | undefined,
      ) => `${walletId}|${type}|${categoryId}|${amount}|${note ?? ''}`;

      // Mirror transaction-store.addTransaction() exactly: insertTransaction()
      // then upsertAnalysis() so each imported row goes through the same code
      // path as a manual add via TransactionForm. createdAt is preserved from
      // the source file so historical sort order stays intact.
      tick('transactions', 0, tTotal);
      let tIdx = 0;
      for (const t of parsed.transactions) {
        const walletId = walletNameToId.get(t.walletName) ?? fallbackWalletId;
        const categoryId = await ensureCategory(t.categoryName, t.type, null);

        const txId = await insertTransaction(db, {
          type: t.type,
          amount: t.amount,
          categoryId,
          note: t.note,
          date: t.date,
          walletId,
          createdAt: t.createdAt,
        });
        transactionsImported++;

        const matchType: 'basic' | 'full' = t.note ? 'full' : 'basic';
        await upsertAnalysis(db, {
          walletId,
          categoryId,
          type: t.type,
          amount: t.amount,
          note: t.note,
          transactionId: txId,
        }, matchType);

        const key = analysisKey(walletId, t.type, categoryId, t.amount, t.note);
        if (!seenAnalysisKeys.has(key)) {
          seenAnalysisKeys.add(key);
          analysisImported++;
        }
        cursor++; tIdx++;
        tick('transactions', tIdx, tTotal);
      }
    });

    return {
      success: true,
      wallets: walletsImported,
      walletsRenamed,
      walletNames,
      categories: categoriesImported,
      transactions: transactionsImported,
      analysis: analysisImported,
      aiHistory: 0,
      settingsRestored: false,
    };
  } catch (e: unknown) {
    return emptyResult(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
  }
}

export async function pickAndImportSpecialData(onProgress?: ImportProgressCallback): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return emptyResult('ยกเลิกการเลือกไฟล์');

  const file = new File(result.assets[0].uri);
  let content: string;
  try {
    content = await file.text();
  } catch {
    return emptyResult('ไม่สามารถอ่านไฟล์นี้ได้');
  }

  const parsed = parsePayFlowText(content);
  if (!parsed) return emptyResult('ไฟล์นี้ไม่ใช่รูปแบบ Pay Flow ที่รองรับ');

  return importParsedSpecialData(parsed, onProgress);
}
