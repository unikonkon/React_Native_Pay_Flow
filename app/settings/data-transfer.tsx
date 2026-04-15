import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  exportAllData,
  getExportCounts,
  pickAndImportData,
  type ExportCounts,
  type ImportResult,
} from '@/lib/utils/data-transfer';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useSettingsStore } from '@/lib/stores/settings-store';

type Tab = 'export' | 'import';

export default function DataTransferScreen() {
  const [tab, setTab] = useState<Tab>('export');
  const [counts, setCounts] = useState<ExportCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportDone, setExportDone] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const loadCategories = useCategoryStore(s => s.loadCategories);
  const loadWallets = useWalletStore(s => s.loadWallets);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const loadAiHistories = useAiHistoryStore(s => s.loadHistories);
  const reloadAlertSettings = useAlertSettingsStore(s => s.loadAlertSettings);
  const loadTheme = useThemeStore(s => s.loadTheme);
  const loadSettings = useSettingsStore(s => s.loadSettings);

  useEffect(() => {
    getExportCounts().then(setCounts);
  }, []);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setExportError(null);
    setExportDone(false);
    try {
      await exportAllData();
      setExportDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ไม่สามารถส่งออกข้อมูลได้';
      console.error('[exportAllData] failed:', e);
      setExportError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    setLoading(true);
    setImportResult(null);
    try {
      const result = await pickAndImportData();
      setImportResult(result);
      if (result.success) {
        await Promise.all([
          loadTransactions(),
          loadCategories(),
          loadWallets(),
          loadAnalysis(),
          loadAiHistories(),
          reloadAlertSettings(),
          loadTheme(),
          loadSettings(),
        ]);
      }
    } catch {
      setImportResult({
        success: false,
        wallets: 0,
        walletsRenamed: 0,
        categories: 0,
        transactions: 0,
        analysis: 0,
        aiHistory: 0,
        settingsRestored: false,
        error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
      });
    } finally {
      setLoading(false);
    }
  }, [loadTransactions, loadCategories, loadWallets, loadAnalysis, loadAiHistories, reloadAlertSettings, loadTheme, loadSettings]);

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <View className="flex-row mx-4 mt-4 mb-4 rounded-xl overflow-hidden border border-border">
        <TabButton
          label="ส่งออกข้อมูล"
          icon="cloud-upload-outline"
          active={tab === 'export'}
          onPress={() => { setTab('export'); setImportResult(null); }}
        />
        <TabButton
          label="นำเข้าข้อมูล"
          icon="cloud-download-outline"
          active={tab === 'import'}
          onPress={() => { setTab('import'); setExportDone(false); setExportError(null); }}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {tab === 'export' ? (
          <ExportTab
            counts={counts}
            loading={loading}
            done={exportDone}
            error={exportError}
            onExport={handleExport}
          />
        ) : (
          <ImportTab loading={loading} result={importResult} onImport={handleImport} />
        )}
      </ScrollView>

      {loading && (
        <View
          pointerEvents="auto"
          className="absolute inset-0 items-center justify-center bg-black/40"
        >
          <View className="bg-card rounded-2xl px-6 py-5 items-center border border-border min-w-[220px]">
            <ActivityIndicator size="large" color="#0891b2" />
            <Text className="text-foreground text-base font-semibold mt-3">
              {tab === 'export' ? 'กำลังส่งออกข้อมูล...' : 'กำลังนำเข้าข้อมูล...'}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1">
              กรุณารอสักครู่
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function TabButton({ label, icon, active, onPress }: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center py-3 ${active ? 'bg-primary' : 'bg-card'}`}
    >
      <Ionicons name={icon} size={16} color={active ? 'white' : '#666'} />
      <Text className={`ml-1.5 font-semibold text-sm ${active ? 'text-white' : 'text-muted-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function ExportTab({ counts, loading, done, error, onExport }: {
  counts: ExportCounts | null;
  loading: boolean;
  done: boolean;
  error: string | null;
  onExport: () => void;
}) {
  return (
    <View>
      <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
        <View className="flex-row items-center mb-3">
          <Ionicons name="document-text-outline" size={20} color="#0891b2" />
          <Text className="text-foreground font-semibold text-base ml-2">ข้อมูลที่จะส่งออก</Text>
        </View>

        {counts ? (
          <View className="gap-2">
            <CountRow icon="wallet-outline" label="กระเป๋าเงิน" count={counts.wallets} />
            <CountRow icon="grid-outline" label="หมวดหมู่" count={counts.categories} />
            <CountRow icon="receipt-outline" label="ธุรกรรม" count={counts.transactions} />
            <CountRow icon="analytics-outline" label="การวิเคราะห์" count={counts.analysis} />
            <CountRow icon="sparkles-outline" label="ประวัติ AI" count={counts.aiHistory} />
            <CountRow icon="settings-outline" label="ตั้งค่าแอป" count={counts.hasSettings ? 1 : 0} suffix="✓" />
            <CountRow icon="alert-circle-outline" label="ตั้งค่าการแจ้งเตือน" count={counts.hasAlertSettings ? 1 : 0} suffix="✓" />
          </View>
        ) : (
          <ActivityIndicator size="small" />
        )}
      </View>

      <View className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-200">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={18} color="#3b82f6" style={{ marginTop: 1 }} />
          <Text className="text-blue-700 text-xs ml-2 flex-1">
            ข้อมูลจะถูกส่งออกเป็นไฟล์ .txt (JSON) รวมข้อมูลทั้งหมดในแอป สามารถใช้นำเข้ากลับได้
          </Text>
        </View>
      </View>

      {done && (
        <View className="bg-green-50 rounded-xl p-3 mb-4 border border-green-200">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
            <Text className="text-green-700 text-sm ml-2 font-medium">ส่งออกข้อมูลเรียบร้อย!</Text>
          </View>
        </View>
      )}

      {error && (
        <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
          <View className="flex-row items-start">
            <Ionicons name="close-circle" size={18} color="#ef4444" style={{ marginTop: 1 }} />
            <Text className="text-red-700 text-xs ml-2 flex-1">{error}</Text>
          </View>
        </View>
      )}

      <Pressable
        onPress={onExport}
        disabled={loading || !counts}
        className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="share-outline" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">ส่งออกข้อมูลทั้งหมด</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function ImportTab({ loading, result, onImport }: {
  loading: boolean;
  result: ImportResult | null;
  onImport: () => void;
}) {
  return (
    <View>
      <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
        <View className="flex-row items-center mb-3">
          <Ionicons name="folder-open-outline" size={20} color="#0891b2" />
          <Text className="text-foreground font-semibold text-base ml-2">นำเข้าจากไฟล์สำรอง</Text>
        </View>
        <Text className="text-muted-foreground text-sm">
          เลือกไฟล์ .txt ที่ส่งออกจาก CeasFlow เพื่อนำข้อมูลเข้าสู่แอป
        </Text>
      </View>

      <View className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
        <View className="flex-row items-start">
          <Ionicons name="warning" size={18} color="#f59e0b" style={{ marginTop: 1 }} />
          <View className="ml-2 flex-1">
            <Text className="text-amber-800 text-xs font-semibold mb-1">หมายเหตุ</Text>
            <Text className="text-amber-700 text-xs">• กระเป๋าที่ชื่อซ้ำจะสร้างเป็นชื่อใหม่ เช่น "เงินสด (2)"</Text>
            <Text className="text-amber-700 text-xs">• ข้อมูลเดิมในแอปจะไม่ถูกลบ</Text>
            <Text className="text-amber-700 text-xs">• หมวดหมู่ default ที่มีอยู่แล้วจะไม่ถูกสร้างซ้ำ</Text>
          </View>
        </View>
      </View>

      {result && result.success && (
        <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
            <Text className="text-green-700 font-bold text-base ml-2">นำเข้าสำเร็จ!</Text>
          </View>
          <View className="gap-1.5">
            <ResultRow label="กระเป๋าเงิน" count={result.wallets} extra={result.walletsRenamed > 0 ? `เปลี่ยนชื่อ ${result.walletsRenamed}` : undefined} />
            <ResultRow label="หมวดหมู่ใหม่" count={result.categories} />
            <ResultRow label="ธุรกรรม" count={result.transactions} />
            <ResultRow label="การวิเคราะห์" count={result.analysis} />
            <ResultRow label="ประวัติ AI" count={result.aiHistory} />
            {result.settingsRestored && (
              <Text className="text-green-700 text-xs">✓ คืนค่าตั้งค่าแอปแล้ว</Text>
            )}
          </View>
        </View>
      )}

      {result && !result.success && (
        <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={18} color="#ef4444" />
            <Text className="text-red-700 text-sm ml-2">{result.error}</Text>
          </View>
        </View>
      )}

      <Pressable
        onPress={onImport}
        disabled={loading}
        className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}
      >
        {loading ? (
          <View className="flex-row items-center">
            <ActivityIndicator color="white" />
            <Text className="text-white font-medium text-base ml-2">กำลังนำเข้า...</Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="document-attach-outline" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">เลือกไฟล์แล้วนำเข้า</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function CountRow({ icon, label, count, suffix }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  suffix?: string;
}) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={16} color="#666" />
      <Text className="text-foreground text-sm ml-2 flex-1">{label}</Text>
      <Text className="text-muted-foreground text-sm font-medium">
        {suffix && count > 0 ? suffix : `${count} รายการ`}
      </Text>
    </View>
  );
}

function ResultRow({ label, count, extra }: { label: string; count: number; extra?: string }) {
  return (
    <View className="flex-row items-center">
      <Text className="text-green-700 text-xs flex-1">• {label}</Text>
      <Text className="text-green-800 text-xs font-medium">
        {count} รายการ{extra ? ` (${extra})` : ''}
      </Text>
    </View>
  );
}
