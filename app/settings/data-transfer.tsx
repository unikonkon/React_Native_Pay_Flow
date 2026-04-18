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
  exportAllDataExcel,
  getExportCounts,
  pickAndImportData,
  pickAndImportDataExcel,
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
type Format = 'txt' | 'excel';

export default function DataTransferScreen() {
  const [tab, setTab] = useState<Tab>('export');
  const [format, setFormat] = useState<Format>('txt');
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

  const reloadAllStores = useCallback(async () => {
    await Promise.all([
      loadTransactions(), loadCategories(), loadWallets(), loadAnalysis(),
      loadAiHistories(), reloadAlertSettings(), loadTheme(), loadSettings(),
    ]);
  }, [loadTransactions, loadCategories, loadWallets, loadAnalysis, loadAiHistories, reloadAlertSettings, loadTheme, loadSettings]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setExportError(null);
    setExportDone(false);
    try {
      if (format === 'txt') await exportAllData();
      else await exportAllDataExcel();
      setExportDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ไม่สามารถส่งออกข้อมูลได้';
      setExportError(msg);
    } finally {
      setLoading(false);
    }
  }, [format]);

  const handleImport = useCallback(async () => {
    setLoading(true);
    setImportResult(null);
    try {
      const result = format === 'txt' ? await pickAndImportData() : await pickAndImportDataExcel();
      setImportResult(result);
      if (result.success) await reloadAllStores();
    } catch {
      setImportResult({
        success: false, wallets: 0, walletsRenamed: 0, categories: 0,
        transactions: 0, analysis: 0, aiHistory: 0, settingsRestored: false,
        error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
      });
    } finally {
      setLoading(false);
    }
  }, [format, reloadAllStores]);

  const clearFeedback = () => {
    setExportDone(false);
    setExportError(null);
    setImportResult(null);
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      {/* Tab: Export / Import */}
      <View className="flex-row mx-4 mt-4 mb-2 rounded-2xl overflow-hidden border border-border">
        <TabButton label="ส่งออกข้อมูล" icon="cloud-upload-outline" active={tab === 'export'}
          onPress={() => { setTab('export'); clearFeedback(); }} />
        <TabButton label="นำเข้าข้อมูล" icon="cloud-download-outline" active={tab === 'import'}
          onPress={() => { setTab('import'); clearFeedback(); }} />
      </View>

      {/* Format: TXT / Excel */}
      <View className="flex-row mx-4 mb-4">
        <FormatButton label="TXT (JSON)" active={format === 'txt'}
          onPress={() => { setFormat('txt'); clearFeedback(); }} />
        <FormatButton label="Excel (.xlsx)" active={format === 'excel'}
          onPress={() => { setFormat('excel'); clearFeedback(); }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {tab === 'export' ? (
          <View>
            {/* Data counts */}
            <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
              <View className="flex-row items-center mb-3">
                <Ionicons name={format === 'txt' ? 'document-text-outline' : 'grid-outline'} size={20} color="#E87A3D" />
                <Text className="text-foreground text-base ml-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>ข้อมูลที่จะส่งออก</Text>
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

            {/* Info */}
            <View className="bg-blue-50 rounded-2xl p-3 mb-4 border border-blue-200">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={18} color="#3b82f6" style={{ marginTop: 1 }} />
                <Text className="text-blue-700 text-xs ml-2 flex-1" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>
                  {format === 'txt'
                    ? 'ข้อมูลจะถูกส่งออกเป็นไฟล์ .txt (JSON) รวมข้อมูลทั้งหมดในแอป สามารถใช้นำเข้ากลับได้'
                    : 'ข้อมูลจะถูกส่งออกเป็นไฟล์ .xlsx รวมข้อมูลทั้งหมด สามารถเปิดด้วย Google Sheets, Excel หรือนำเข้ากลับได้'}
                </Text>
              </View>
            </View>

            {/* Feedback */}
            {exportDone && (
              <View className="bg-green-50 rounded-2xl p-3 mb-4 border border-green-200">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  <Text className="text-green-700 text-sm ml-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}>ส่งออกข้อมูลเรียบร้อย!</Text>
                </View>
              </View>
            )}
            {exportError && (
              <View className="bg-red-50 rounded-2xl p-3 mb-4 border border-red-200">
                <View className="flex-row items-start">
                  <Ionicons name="close-circle" size={18} color="#ef4444" style={{ marginTop: 1 }} />
                  <Text className="text-red-700 text-xs ml-2 flex-1" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>{exportError}</Text>
                </View>
              </View>
            )}

            {/* Export button */}
            <Pressable onPress={handleExport} disabled={loading || !counts}
              className={`rounded-full py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
              {loading ? <ActivityIndicator color="white" /> : (
                <View className="flex-row items-center">
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15 }}>
                    ส่งออกข้อมูลทั้งหมด ({format === 'txt' ? '.txt' : '.xlsx'})
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        ) : (
          <View>
            {/* Import description */}
            <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
              <View className="flex-row items-center mb-3">
                <Ionicons name="folder-open-outline" size={20} color="#E87A3D" />
                <Text className="text-foreground text-base ml-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>นำเข้าจากไฟล์สำรอง</Text>
              </View>
              <Text className="text-muted-foreground text-sm" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>
                {format === 'txt'
                  ? 'เลือกไฟล์ .txt ที่ส่งออกจาก CeasFlow เพื่อนำข้อมูลเข้าสู่แอป'
                  : 'เลือกไฟล์ .xlsx ที่ส่งออกจาก CeasFlow เพื่อนำข้อมูลเข้าสู่แอป'}
              </Text>
            </View>

            {/* Warning */}
            <View className="bg-amber-50 rounded-2xl p-3 mb-4 border border-amber-200">
              <View className="flex-row items-start">
                <Ionicons name="warning" size={18} color="#f59e0b" style={{ marginTop: 1 }} />
                <View className="ml-2 flex-1">
                  <Text className="text-amber-800 text-xs mb-1" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }}>หมายเหตุ</Text>
                  <Text className="text-amber-700 text-xs" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>• กระเป๋าที่ชื่อซ้ำจะสร้างเป็นชื่อใหม่ เช่น "เงินสด (2)"</Text>
                  <Text className="text-amber-700 text-xs" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>• ข้อมูลเดิมในแอปจะไม่ถูกลบ</Text>
                  <Text className="text-amber-700 text-xs" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>• หมวดหมู่ default ที่มีอยู่แล้วจะไม่ถูกสร้างซ้ำ</Text>
                </View>
              </View>
            </View>

            {/* Import result */}
            {importResult && importResult.success && (
              <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                  <Text className="text-green-700 text-base ml-2" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15 }}>นำเข้าสำเร็จ!</Text>
                </View>
                <View className="gap-1.5">
                  <ResultRow label="กระเป๋าเงิน" count={importResult.wallets} extra={importResult.walletsRenamed > 0 ? `เปลี่ยนชื่อ ${importResult.walletsRenamed}` : undefined} />
                  <ResultRow label="หมวดหมู่ใหม่" count={importResult.categories} />
                  <ResultRow label="ธุรกรรม" count={importResult.transactions} />
                  <ResultRow label="การวิเคราะห์" count={importResult.analysis} />
                  <ResultRow label="ประวัติ AI" count={importResult.aiHistory} />
                  {importResult.settingsRestored && (
                    <Text className="text-green-700 text-xs" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>✓ คืนค่าตั้งค่าแอปแล้ว</Text>
                  )}
                </View>
              </View>
            )}
            {importResult && !importResult.success && (
              <View className="bg-red-50 rounded-2xl p-3 mb-4 border border-red-200">
                <View className="flex-row items-center">
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                  <Text className="text-red-700 text-sm ml-2" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>{importResult.error}</Text>
                </View>
              </View>
            )}

            {/* Import button */}
            <Pressable onPress={handleImport} disabled={loading}
              className={`rounded-full py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
              {loading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="white" />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>กำลังนำเข้า...</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="document-attach-outline" size={20} color="white" />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15 }}>
                    เลือกไฟล์ {format === 'txt' ? '.txt' : '.xlsx'} แล้วนำเข้า
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Loading overlay */}
      {loading && (
        <View pointerEvents="auto" className="absolute inset-0 items-center justify-center bg-black/40">
          <View className="bg-card rounded-2xl px-6 py-5 items-center border border-border min-w-[220px]">
            <ActivityIndicator size="large" color="#E87A3D" />
            <Text className="text-foreground text-base mt-3" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>
              {tab === 'export' ? 'กำลังส่งออกข้อมูล...' : 'กำลังนำเข้าข้อมูล...'}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>กรุณารอสักครู่</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function TabButton({ label, icon, active, onPress }: {
  label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}
      className={`flex-1 flex-row items-center justify-center py-3 ${active ? 'bg-primary' : 'bg-card'}`}>
      <Ionicons name={icon} size={16} color={active ? 'white' : '#666'} />
      <Text className={`ml-1.5 text-sm ${active ? 'text-white' : 'text-muted-foreground'}`} style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function FormatButton({ label, active, onPress }: {
  label: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}
      className={`flex-1 items-center py-2 mx-1 rounded-xl border ${active ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
      <Text className={`text-xs ${active ? 'text-primary' : 'text-muted-foreground'}`} style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function CountRow({ icon, label, count, suffix }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; count: number; suffix?: string;
}) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={16} color="#6B5F52" />
      <Text className="text-foreground text-sm ml-2 flex-1" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>{label}</Text>
      <Text className="text-muted-foreground text-sm" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}>
        {suffix && count > 0 ? suffix : `${count} รายการ`}
      </Text>
    </View>
  );
}

function ResultRow({ label, count, extra }: { label: string; count: number; extra?: string }) {
  return (
    <View className="flex-row items-center">
      <Text className="text-green-700 text-xs flex-1" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>• {label}</Text>
      <Text className="text-green-800 text-xs" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }}>
        {count} รายการ{extra ? ` (${extra})` : ''}
      </Text>
    </View>
  );
}
