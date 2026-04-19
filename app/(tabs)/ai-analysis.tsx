import { MiawHero, MiawThinking, GoldCracks } from '@/assets/svg';
import { AiResultView } from '@/components/ai/AiResultView';
import { analyzeFinances, getApiKey, getThaiMonthName } from '@/lib/api/ai';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { getAvailableMonths, getAvailableYears, getDb, getTransactionsByRange, getTransactionsByYear } from '@/lib/stores/db';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import type { AiHistory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
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

type PromptType = 'structured' | 'full';
type InnerTab = 'ai' | 'data';
type DataTab = 'export' | 'import';
type DataFormat = 'txt' | 'excel';

const THAI_MONTHS_SHORT = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function getPeriodLabel(year: number, month: number | null): string {
  const buddhistYear = year + 543;
  if (month) return `${getThaiMonthName(month)} ${buddhistYear}`;
  return `ปี ${buddhistYear}`;
}

// ===== Premium Paywall =====

function PremiumPaywall({ onUnlock }: { onUnlock: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
      {/* Hero with mascot */}
      <View className="items-center" style={{ paddingTop: 12 }}>
        <MiawHero size={160} />
        <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 24, marginTop: 4 }} className="text-foreground">
          แมวมันนี่ Premium
        </Text>
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }} className="text-muted-foreground">
          ปลดล็อกฟีเจอร์ขั้นสูงเพื่อจัดการเงินอย่างมืออาชีพ
        </Text>
      </View>

      {/* Features card */}
      <View className="bg-card border border-border" style={{ margin: 16, marginTop: 24, padding: 18, borderRadius: 20 }}>
        <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, marginBottom: 14 }} className="text-foreground">
          ฟีเจอร์ Premium
        </Text>
        <FeatureRow icon="sparkles" label="AI วิเคราะห์การเงิน" desc="วิเคราะห์รายรับ-รายจ่ายอัจฉริยะด้วย AI" />
        <FeatureRow icon="swap-horizontal" label="ส่งออก / นำเข้าข้อมูล" desc="สำรองและกู้คืนข้อมูลได้ทุกเมื่อ" />
        <FeatureRow icon="analytics" label="รายงานเชิงลึก" desc="สรุปผลแบบละเอียดรายเดือนและรายปี" />
        <FeatureRow icon="shield-checkmark" label="สำรองข้อมูลอัตโนมัติ" desc="ป้องกันข้อมูลสูญหาย" last />
      </View>

      {/* Packages */}
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }} className="text-foreground">
        เลือกแพ็กเกจ
      </Text>
      <View className="flex-row" style={{ gap: 10, paddingHorizontal: 16 }}>
        {/* Monthly */}
        <Pressable
          onPress={() => setSelectedPlan('monthly')}
          className="flex-1 bg-card"
          style={{
            padding: 16,
            borderRadius: 18,
            borderWidth: selectedPlan === 'monthly' ? 2 : 1,
            borderColor: selectedPlan === 'monthly' ? '#E87A3D' : '#EDE4D3',
            backgroundColor: selectedPlan === 'monthly' ? 'rgba(232,122,61,0.08)' : undefined,
          }}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground">รายเดือน</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, marginTop: 4 }} className="text-foreground">฿99</Text>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 2 }} className="text-muted-foreground">/เดือน</Text>
        </Pressable>

        {/* Yearly */}
        <View className="flex-1" style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute', top: -10, right: 8, zIndex: 2,
            paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999,
            backgroundColor: '#E8B547',
          }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 11, color: '#fff' }}>ประหยัด 25%</Text>
          </View>
          <Pressable
            onPress={() => setSelectedPlan('yearly')}
            className="bg-card"
            style={{
              padding: 16,
              borderRadius: 18,
              borderWidth: selectedPlan === 'yearly' ? 2 : 1,
              borderColor: selectedPlan === 'yearly' ? '#E87A3D' : '#EDE4D3',
              backgroundColor: selectedPlan === 'yearly' ? 'rgba(232,122,61,0.08)' : undefined,
            }}
          >
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground">รายปี</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, marginTop: 4 }} className="text-foreground">฿899</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 2 }} className="text-muted-foreground">/ปี (฿74.91/เดือน)</Text>
          </Pressable>
        </View>
      </View>

      {/* CTA Button */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Pressable
          onPress={() => {
            Alert.alert(
              'เร็ว ๆ นี้',
              'ระบบสมัครสมาชิกกำลังพัฒนา ขอบคุณที่สนใจ!',
              [
                { text: 'ตกลง', style: 'default' },
                { text: 'ทดลองใช้ (Dev)', onPress: onUnlock },
              ],
            );
          }}
          style={{
            paddingVertical: 16, borderRadius: 16,
            backgroundColor: '#E87A3D',
            shadowColor: '#E87A3D', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
            elevation: 8,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Ionicons name="diamond" size={18} color="white" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, color: '#fff' }}>สมัครสมาชิก Premium</Text>
        </Pressable>
      </View>

      {/* Footer note */}
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, textAlign: 'center', paddingHorizontal: 24, paddingTop: 16 }} className="text-muted-foreground">
        สามารถยกเลิกได้ทุกเมื่อ · ต่ออายุอัตโนมัติ · ไม่มีค่าใช้จ่ายแอบแฝง
      </Text>
    </ScrollView>
  );
}

function FeatureRow({ icon, label, desc, last }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; desc: string; last?: boolean;
}) {
  return (
    <View className="flex-row items-start" style={{
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: last ? 0 : 0.5,
      borderBottomColor: '#EDE4D3',
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#E87A3D',
      }}>
        <Ionicons name={icon} size={16} color="white" />
      </View>
      <View className="flex-1">
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">{label}</Text>
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }} className="text-muted-foreground">{desc}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={20} color="#3E8B68" style={{ marginTop: 2 }} />
    </View>
  );
}

// ===== Loading Animation =====

const LOADING_STEPS = [
  { icon: 'document-text-outline' as const, text: 'กำลังรวบรวมข้อมูล...' },
  { icon: 'analytics-outline' as const, text: 'วิเคราะห์รายรับ-รายจ่าย...' },
  { icon: 'sparkles-outline' as const, text: 'AI กำลังประมวลผล...' },
  { icon: 'checkmark-circle-outline' as const, text: 'กำลังสรุปผลลัพธ์...' },
];

function AiLoadingView() {
  const pulse = useSharedValue(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]) }],
  }));

  const step = LOADING_STEPS[stepIndex];

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      className="bg-card rounded-2xl p-6 border border-border mb-6 items-center"
    >
      <View className="mb-4">
        <MiawThinking size={100} />
      </View>
      <Animated.Text key={stepIndex} entering={FadeIn.duration(400)} className="text-foreground font-semibold text-base mb-1">
        {step.text}
      </Animated.Text>
      <Text className="text-muted-foreground text-xs mb-4">โปรดรอสักครู่</Text>
      <View className="w-full gap-3">
        {[0, 1, 2].map(i => <ShimmerBar key={i} index={i} />)}
      </View>
    </Animated.View>
  );
}

function ShimmerBar({ index }: { index: number }) {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withDelay(index * 150, withRepeat(withTiming(1, { duration: 1000, easing: Easing.ease }), -1, true));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: interpolate(shimmer.value, [0, 1], [0.2, 0.5]) }));
  const width = index === 0 ? '100%' : index === 1 ? '75%' : '50%';
  return <Animated.View style={[style, { width, height: 10, borderRadius: 5, backgroundColor: '#888' }]} />;
}

// ===== History Modal =====

function HistoryModal({
  visible,
  onClose,
  histories,
  wallets,
  onView,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  histories: AiHistory[];
  wallets: { id: string; name: string }[];
  onView: (h: AiHistory) => void;
  onDelete: (h: AiHistory) => void;
}) {
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterWalletId, setFilterWalletId] = useState<string | 'all'>('all');

  const years = useMemo(() => {
    const set = new Set(histories.map(h => h.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [histories]);

  const filtered = useMemo(() => {
    return histories.filter(h => {
      if (filterYear !== null && h.year !== filterYear) return false;
      if (filterMonth !== null && h.month !== filterMonth) return false;
      if (filterWalletId !== 'all' && h.walletId !== filterWalletId) return false;
      return true;
    });
  }, [histories, filterYear, filterMonth, filterWalletId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40" />
      <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl" style={{ height: '90%' }}>
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text className="text-foreground font-bold text-lg">ประวัติการวิเคราะห์</Text>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#666" />
            </Pressable>
          </View>

          {/* Filters */}
          <View className="px-4 pb-2 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => { setFilterYear(null); setFilterMonth(null); }}
              className={`px-3 py-1.5 rounded-full border ${filterYear === null ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text className={`text-sm ${filterYear === null ? 'text-primary font-semibold' : 'text-foreground'}`}>ทุกปี</Text>
            </Pressable>
            {years.map(y => (
              <Pressable
                key={y}
                onPress={() => { setFilterYear(y); setFilterMonth(null); }}
                className={`px-3 py-1.5 rounded-full border ${filterYear === y ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <Text className={`text-sm ${filterYear === y ? 'text-primary font-semibold' : 'text-foreground'}`}>{y + 543}</Text>
              </Pressable>
            ))}
          </View>

          {filterYear !== null && (
            <View className="px-4 pb-2 flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => setFilterMonth(null)}
                className={`px-3 py-1.5 rounded-full border ${filterMonth === null ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <Text className={`text-sm ${filterMonth === null ? 'text-primary font-semibold' : 'text-foreground'}`}>ทุกเดือน</Text>
              </Pressable>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <Pressable
                  key={m}
                  onPress={() => setFilterMonth(m)}
                  className={`px-3 py-1.5 rounded-full border ${filterMonth === m ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                >
                  <Text className={`text-xs ${filterMonth === m ? 'text-primary font-semibold' : 'text-foreground'}`}>{THAI_MONTHS_SHORT[m]}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View className="px-4 pb-3 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setFilterWalletId('all')}
              className={`px-3 py-1.5 rounded-full border ${filterWalletId === 'all' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text className={`text-sm ${filterWalletId === 'all' ? 'text-primary font-semibold' : 'text-foreground'}`}>ทุกกระเป๋า</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterWalletId('none')}
              className={`px-3 py-1.5 rounded-full border ${filterWalletId === 'none' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text className={`text-xs ${filterWalletId === 'none' ? 'text-primary font-semibold' : 'text-foreground'}`}>ไม่ระบุ</Text>
            </Pressable>
            {wallets.map(w => (
              <Pressable
                key={w.id}
                onPress={() => setFilterWalletId(w.id)}
                className={`px-3 py-1.5 rounded-full border ${filterWalletId === w.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <Text className={`text-xs ${filterWalletId === w.id ? 'text-primary font-semibold' : 'text-foreground'}`}>{w.name}</Text>
              </Pressable>
            ))}
          </View>

          {/* List */}
          <ScrollView className="px-4 pb-6">
            {filtered.length === 0 ? (
              <Text className="text-muted-foreground text-sm text-center py-8">ไม่พบประวัติ</Text>
            ) : (
              filtered.map(h => (
                <Pressable
                  key={h.id}
                  onPress={() => { onView(h); onClose(); }}
                  onLongPress={() => onDelete(h)}
                  className="flex-row items-center px-4 py-3 bg-card border-b border-border rounded-xl mb-2"
                >
                  <Ionicons name="document-text-outline" size={20} color="#E87A3D" />
                  <View className="flex-1 ml-3">
                    <Text className="text-foreground font-medium">
                      {getPeriodLabel(h.year, h.month)} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} • {new Date(h.createdAt).toLocaleDateString('th-TH')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
    </Modal>
  );
}

// ===== Data Transfer Tab =====

function DataTransferTab() {
  const [dataTab, setDataTab] = useState<DataTab>('export');
  const [format, setFormat] = useState<DataFormat>('txt');
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
    <View>
      {/* Sub-tab: Export / Import */}
      <View className="flex-row mb-3 rounded-xl overflow-hidden border border-border">
        <Pressable
          onPress={() => { setDataTab('export'); clearFeedback(); }}
          className={`flex-1 flex-row items-center justify-center py-2.5 ${dataTab === 'export' ? 'bg-primary' : 'bg-card'}`}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={dataTab === 'export' ? 'white' : '#666'} />
          <Text className={`ml-1.5 font-semibold text-sm ${dataTab === 'export' ? 'text-white' : 'text-muted-foreground'}`}>ส่งออก</Text>
        </Pressable>
        <Pressable
          onPress={() => { setDataTab('import'); clearFeedback(); }}
          className={`flex-1 flex-row items-center justify-center py-2.5 ${dataTab === 'import' ? 'bg-primary' : 'bg-card'}`}
        >
          <Ionicons name="cloud-download-outline" size={16} color={dataTab === 'import' ? 'white' : '#666'} />
          <Text className={`ml-1.5 font-semibold text-sm ${dataTab === 'import' ? 'text-white' : 'text-muted-foreground'}`}>นำเข้า</Text>
        </Pressable>
      </View>

      {/* Format: TXT / Excel */}
      <View className="flex-row mb-4">
        <Pressable
          onPress={() => { setFormat('txt'); clearFeedback(); }}
          className={`flex-1 items-center py-2 mx-1 rounded-lg border ${format === 'txt' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
        >
          <Text className={`text-xs font-semibold ${format === 'txt' ? 'text-primary' : 'text-muted-foreground'}`}>TXT (JSON)</Text>
        </Pressable>
        <Pressable
          onPress={() => { setFormat('excel'); clearFeedback(); }}
          className={`flex-1 items-center py-2 mx-1 rounded-lg border ${format === 'excel' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
        >
          <Text className={`text-xs font-semibold ${format === 'excel' ? 'text-primary' : 'text-muted-foreground'}`}>Excel (.xlsx)</Text>
        </Pressable>
      </View>

      {dataTab === 'export' ? (
        <View>
          {/* Data counts */}
          <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
            <View className="flex-row items-center mb-3">
              <Ionicons name={format === 'txt' ? 'document-text-outline' : 'grid-outline'} size={20} color="#E87A3D" />
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

          {/* Info */}
          <View className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={18} color="#3b82f6" style={{ marginTop: 1 }} />
              <Text className="text-blue-700 text-xs ml-2 flex-1">
                {format === 'txt'
                  ? 'ข้อมูลจะถูกส่งออกเป็นไฟล์ .txt (JSON) รวมข้อมูลทั้งหมดในแอป สามารถใช้นำเข้ากลับได้'
                  : 'ข้อมูลจะถูกส่งออกเป็นไฟล์ .xlsx รวมข้อมูลทั้งหมด สามารถเปิดด้วย Google Sheets, Excel หรือนำเข้ากลับได้'}
              </Text>
            </View>
          </View>

          {/* Feedback */}
          {exportDone && (
            <View className="bg-green-50 rounded-xl p-3 mb-4 border border-green-200">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                <Text className="text-green-700 text-sm ml-2 font-medium">ส่งออกข้อมูลเรียบร้อย!</Text>
              </View>
            </View>
          )}
          {exportError && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <View className="flex-row items-start">
                <Ionicons name="close-circle" size={18} color="#ef4444" style={{ marginTop: 1 }} />
                <Text className="text-red-700 text-xs ml-2 flex-1">{exportError}</Text>
              </View>
            </View>
          )}

          {/* Export button */}
          <Pressable onPress={handleExport} disabled={loading || !counts}
            className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
            {loading ? <ActivityIndicator color="white" /> : (
              <View className="flex-row items-center">
                <Ionicons name="share-outline" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
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
              <Text className="text-foreground font-semibold text-base ml-2">นำเข้าจากไฟล์สำรอง</Text>
            </View>
            <Text className="text-muted-foreground text-sm">
              {format === 'txt'
                ? 'เลือกไฟล์ .txt ที่ส่งออกจาก CeasFlow เพื่อนำข้อมูลเข้าสู่แอป'
                : 'เลือกไฟล์ .xlsx ที่ส่งออกจาก CeasFlow เพื่อนำข้อมูลเข้าสู่แอป'}
            </Text>
          </View>

          {/* Warning */}
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

          {/* Import result */}
          {importResult && importResult.success && (
            <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                <Text className="text-green-700 font-bold text-base ml-2">นำเข้าสำเร็จ!</Text>
              </View>
              <View className="gap-1.5">
                <ResultRow label="กระเป๋าเงิน" count={importResult.wallets} extra={importResult.walletsRenamed > 0 ? `เปลี่ยนชื่อ ${importResult.walletsRenamed}` : undefined} />
                <ResultRow label="หมวดหมู่ใหม่" count={importResult.categories} />
                <ResultRow label="ธุรกรรม" count={importResult.transactions} />
                <ResultRow label="การวิเคราะห์" count={importResult.analysis} />
                <ResultRow label="ประวัติ AI" count={importResult.aiHistory} />
                {importResult.settingsRestored && (
                  <Text className="text-green-700 text-xs">✓ คืนค่าตั้งค่าแอปแล้ว</Text>
                )}
              </View>
            </View>
          )}
          {importResult && !importResult.success && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text className="text-red-700 text-sm ml-2">{importResult.error}</Text>
              </View>
            </View>
          )}

          {/* Import button */}
          <Pressable onPress={handleImport} disabled={loading}
            className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" />
                <Text className="text-white font-medium text-base ml-2">กำลังนำเข้า...</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="document-attach-outline" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  เลือกไฟล์ {format === 'txt' ? '.txt' : '.xlsx'} แล้วนำเข้า
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View pointerEvents="auto" className="absolute inset-0 items-center justify-center bg-black/40" style={{ zIndex: 50 }}>
          <View className="bg-card rounded-2xl px-6 py-5 items-center border border-border min-w-[220px]">
            <ActivityIndicator size="large" color="#E87A3D" />
            <Text className="text-foreground text-base font-semibold mt-3">
              {dataTab === 'export' ? 'กำลังส่งออกข้อมูล...' : 'กำลังนำเข้าข้อมูล...'}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1">กรุณารอสักครู่</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function CountRow({ icon, label, count, suffix }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; count: number; suffix?: string;
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

// ===== Main Screen =====

export default function PremiumScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [innerTab, setInnerTab] = useState<InnerTab>('ai');

  const wallets = useWalletStore(s => s.wallets);
  const { histories, addHistory, deleteHistory } = useAiHistoryStore();

  const currentYear = new Date().getFullYear() + 543;

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<PromptType>('structured');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ type: string; data: string; periodLabel: string } | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const gregorianYear = selectedYear - 543;

  const loadYears = useCallback(async (walletId: string | null) => {
    try {
      const db = getDb();
      const gregorianYears = await getAvailableYears(db, walletId);
      const buddhistYears = gregorianYears.map(y => y + 543);
      setAvailableYears(buddhistYears);
      if (buddhistYears.length > 0 && !buddhistYears.includes(selectedYear)) {
        setSelectedYear(buddhistYears[0]);
      }
    } catch {
      setAvailableYears([]);
    }
  }, [selectedYear]);

  const loadMonths = useCallback(async (year: number, walletId: string | null) => {
    try {
      const db = getDb();
      const months = await getAvailableMonths(db, year, walletId);
      setAvailableMonths(months);
      if (selectedMonth !== null && !months.includes(selectedMonth)) {
        setSelectedMonth(null);
      }
    } catch {
      setAvailableMonths([]);
    }
  }, [selectedMonth]);

  useEffect(() => {
    getApiKey().then(key => setHasApiKey(!!key));
    loadYears(selectedWalletId);
  }, []);

  useEffect(() => {
    if (availableYears.length > 0) {
      loadMonths(gregorianYear, selectedWalletId);
    }
  }, [gregorianYear, selectedWalletId, availableYears]);

  const handleSelectYear = (y: number) => {
    setSelectedYear(y);
    setSelectedMonth(null);
  };

  const handleSelectWallet = (id: string | null) => {
    setSelectedWalletId(id);
    loadYears(id);
    setSelectedMonth(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!hasApiKey) {
      Alert.alert('ยังไม่ได้ตั้งค่า', 'กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อน');
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const db = getDb();
      let transactions;
      if (selectedMonth) {
        const start = `${gregorianYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(gregorianYear, selectedMonth, 0).getDate();
        const end = `${gregorianYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        transactions = await getTransactionsByRange(db, start, end, selectedWalletId);
      } else {
        transactions = await getTransactionsByYear(db, gregorianYear, selectedWalletId ?? undefined);
      }

      if (transactions.length === 0) {
        const label = selectedMonth ? `${THAI_MONTHS_SHORT[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`;
        Alert.alert('ไม่มีข้อมูล', `ไม่พบรายการใน${label}`);
        setIsLoading(false);
        return;
      }

      const result = await analyzeFinances({
        year: gregorianYear,
        month: selectedMonth,
        walletId: selectedWalletId,
        promptType,
        transactions,
      });

      const periodLabel = getPeriodLabel(gregorianYear, selectedMonth);
      setCurrentResult({ type: result.responseType, data: result.result, periodLabel });

      await addHistory({
        walletId: selectedWalletId,
        promptType,
        year: gregorianYear,
        month: selectedMonth,
        responseType: result.responseType,
        responseData: result.result,
      });
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message ?? 'ไม่สามารถวิเคราะห์ได้');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedWalletId, promptType, gregorianYear, addHistory, hasApiKey]);

  const handleViewHistory = useCallback((history: AiHistory) => {
    const periodLabel = getPeriodLabel(history.year, history.month);
    setCurrentResult({ type: history.responseType, data: history.responseData, periodLabel });
  }, []);

  const handleDeleteHistory = useCallback((history: AiHistory) => {
    Alert.alert('ลบประวัติ', 'ต้องการลบประวัติการวิเคราะห์นี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteHistory(history.id) },
    ]);
  }, [deleteHistory]);

  const recentHistories = histories.slice(0, 5);

  // ===== Not Premium: show paywall =====
  if (!isPremium) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <PremiumPaywall onUnlock={() => setIsPremium(true)} />
      </SafeAreaView>
    );
  }

  // ===== Premium: show inner tabs =====
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="diamond" size={20} color="#E87A3D" />
          <Text className="text-foreground text-2xl font-bold ml-2">Premium</Text>
        </View>
      </View>

      {/* Inner Tab Bar */}
      <View className="flex-row mx-4 mb-3 rounded-xl overflow-hidden border border-border">
        <Pressable
          onPress={() => setInnerTab('ai')}
          className={`flex-1 flex-row items-center justify-center py-2.5 ${innerTab === 'ai' ? 'bg-primary' : 'bg-card'}`}
        >
          <Ionicons name="sparkles-outline" size={16} color={innerTab === 'ai' ? 'white' : '#666'} />
          <Text className={`ml-1.5 font-semibold text-sm ${innerTab === 'ai' ? 'text-white' : 'text-muted-foreground'}`}>
            AI วิเคราะห์
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setInnerTab('data')}
          className={`flex-1 flex-row items-center justify-center py-2.5 ${innerTab === 'data' ? 'bg-primary' : 'bg-card'}`}
        >
          <Ionicons name="swap-horizontal-outline" size={16} color={innerTab === 'data' ? 'white' : '#666'} />
          <Text className={`ml-1.5 font-semibold text-sm ${innerTab === 'data' ? 'text-white' : 'text-muted-foreground'}`}>
            ข้อมูล
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        {innerTab === 'ai' ? (
          <>
            {!hasApiKey && (
              <View className="bg-expense/10 rounded-xl p-3 mb-4 flex-row items-center">
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
                <Text className="text-foreground text-sm ml-2 flex-1">
                  กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อนใช้งาน
                </Text>
              </View>
            )}

            {/* Year Selector */}
            <Text className="text-foreground font-semibold mb-2">ปี</Text>
            {availableYears.length === 0 ? (
              <View className="bg-secondary/50 rounded-xl p-3 mb-4">
                <Text className="text-muted-foreground text-sm text-center">
                  ยังไม่มีข้อมูลรายการ{selectedWalletId ? 'ในกระเป๋านี้' : ''}
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row gap-2">
                  {availableYears.map(y => (
                    <Pressable
                      key={y}
                      onPress={() => handleSelectYear(y)}
                      className={`px-4 py-2 rounded-full border ${selectedYear === y ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                    >
                      <Text className={`${selectedYear === y ? 'text-primary font-semibold' : 'text-foreground'}`}>{y}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Month Selector */}
            {availableMonths.length > 0 && (
              <>
                <Text className="text-foreground font-semibold mb-2">เดือน</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setSelectedMonth(null)}
                      className={`px-3 py-2 rounded-full border ${selectedMonth === null ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                    >
                      <Text className={`text-sm ${selectedMonth === null ? 'text-primary font-semibold' : 'text-foreground'}`}>ทั้งปี</Text>
                    </Pressable>
                    {availableMonths.map(m => (
                      <Pressable
                        key={m}
                        onPress={() => setSelectedMonth(m)}
                        className={`px-3 py-2 rounded-full border ${selectedMonth === m ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                      >
                        <Text className={`text-sm ${selectedMonth === m ? 'text-primary font-semibold' : 'text-foreground'}`}>{THAI_MONTHS_SHORT[m]}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Wallet Selector */}
            <Text className="text-foreground font-semibold mb-2">กระเป๋าเงิน</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleSelectWallet(null)}
                  className={`px-3 py-2 rounded-full border ${!selectedWalletId ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                >
                  <Text className={`text-sm ${!selectedWalletId ? 'text-primary font-semibold' : 'text-foreground'}`}>ทุกกระเป๋า</Text>
                </Pressable>
                {wallets.map(w => (
                  <Pressable
                    key={w.id}
                    onPress={() => handleSelectWallet(w.id)}
                    className={`flex-row items-center px-3 py-2 rounded-full border ${selectedWalletId === w.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                  >
                    <View className="w-5 h-5 rounded-full items-center justify-center mr-1" style={{ backgroundColor: w.color }}>
                      <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={10} color="white" />
                    </View>
                    <Text className={`text-sm ${selectedWalletId === w.id ? 'text-primary font-semibold' : 'text-foreground'}`}>{w.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Prompt Type */}
            <Text className="text-foreground font-semibold mb-2">รูปแบบ</Text>
            <View className="flex-row mb-4 rounded-xl overflow-hidden border border-border">
              <Pressable
                onPress={() => setPromptType('structured')}
                className={`flex-1 py-2.5 items-center ${promptType === 'structured' ? 'bg-primary' : 'bg-card'}`}
              >
                <Text className={`text-sm font-semibold ${promptType === 'structured' ? 'text-primary-foreground' : 'text-foreground'}`}>
                  วิเคราะห์แบบสรุป
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPromptType('full')}
                className={`flex-1 py-2.5 items-center ${promptType === 'full' ? 'bg-primary' : 'bg-card'}`}
              >
                <Text className={`text-sm font-semibold ${promptType === 'full' ? 'text-primary-foreground' : 'text-foreground'}`}>
                  วิเคราะห์แบบละเอียด
                </Text>
              </Pressable>
            </View>

            {/* Analyze Button */}
            <Pressable
              onPress={handleAnalyze}
              disabled={isLoading || !hasApiKey || availableYears.length === 0}
              className={`flex-row items-center justify-center py-4 rounded-xl mb-6 ${isLoading || !hasApiKey || availableYears.length === 0 ? 'bg-primary/50' : 'bg-primary'}`}
            >
              {isLoading ? <ActivityIndicator color="white" /> : <Ionicons name="sparkles" size={20} color="white" />}
              <Text className="text-white font-bold text-lg ml-2">
                {isLoading ? 'กำลังวิเคราะห์...' : 'เริ่มวิเคราะห์'}
              </Text>
            </Pressable>

            {isLoading && <AiLoadingView />}

            {/* History */}
            {histories.length > 0 && !isLoading && (
              <View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-foreground font-bold text-base">ประวัติการวิเคราะห์</Text>
                  {histories.length > 5 && (
                    <Pressable onPress={() => setHistoryModalVisible(true)} className="flex-row items-center">
                      <Text className="text-primary text-sm font-semibold mr-1">ดูทั้งหมด ({histories.length})</Text>
                      <Ionicons name="chevron-forward" size={14} color="#E87A3D" />
                    </Pressable>
                  )}
                </View>
                {recentHistories.map(h => (
                  <Pressable
                    key={h.id}
                    onPress={() => handleViewHistory(h)}
                    onLongPress={() => handleDeleteHistory(h)}
                    className="flex-row items-center px-4 py-3 bg-card border-b border-border rounded-xl mb-2"
                  >
                    <Ionicons name="document-text-outline" size={20} color="#E87A3D" />
                    <View className="flex-1 ml-3">
                      <Text className="text-foreground font-medium">
                        {getPeriodLabel(h.year, h.month)} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                      </Text>
                      <Text className="text-muted-foreground text-xs">
                        {h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} • {new Date(h.createdAt).toLocaleDateString('th-TH')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Current Result */}
            {currentResult && !isLoading && (
              <View className="mb-6">
                <Text className="text-foreground font-bold text-base mb-3">ผลวิเคราะห์</Text>
                <AiResultView
                  responseType={currentResult.type as any}
                  responseData={currentResult.data}
                  periodLabel={currentResult.periodLabel}
                />
              </View>
            )}
          </>
        ) : (
          <DataTransferTab />
        )}
      </ScrollView>

      <HistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        histories={histories}
        wallets={wallets}
        onView={handleViewHistory}
        onDelete={handleDeleteHistory}
      />
    </SafeAreaView>
  );
}
