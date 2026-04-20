import { GoldCracks, MiawThinking } from '@/assets/svg';
import { AiResultView } from '@/components/ai/AiResultView';
import { analyzeFinances, getApiKey, getThaiMonthName } from '@/lib/api/ai';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getAvailableMonths, getAvailableYears, getDb, getTransactionsByRange, getTransactionsByYear } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import {
  exportAllData,
  exportAllDataExcel,
  getExportCounts,
  pickAndImportData,
  pickAndImportDataExcel,
  type ExportCounts,
  type ImportResult,
} from '@/lib/utils/data-transfer';
import type { AiHistory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const mascotPlus = require('@/assets/mascot-cosmic.png');

const PREMIUM_FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'sparkles-outline', title: 'AI วิเคราะห์การใช้จ่าย', desc: 'มิวช่วยดูพฤติกรรมการใช้เงิน ทุกสัปดาห์' },
  { icon: 'download-outline', title: 'Export รายงาน PDF/Excel', desc: 'ส่งให้นักบัญชีหรือเก็บเป็นหลักฐาน' },
  { icon: 'color-palette-outline', title: 'ธีมพิเศษ + มิวเปลี่ยนชุด', desc: '12 ธีม และชุดมิวตามฤดูกาล' },
];

function PremiumPaywall({ onUnlock }: { onUnlock: () => void }) {
  const [plan, setPlan] = useState<'month' | 'year'>('year');

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Hero card with gradient */}
      <View style={{
        marginHorizontal: 16, marginTop: 8, marginBottom: 14,
        paddingVertical: 22, paddingHorizontal: 20,
        borderRadius: 28, overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Gradient background */}
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: '#FCE8D4',
        }} />
        <View style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: '40%',
          backgroundColor: '#D8CCEC', opacity: 0.6,
          borderTopLeftRadius: 80,
        }} />
        {/* Gold cracks decoration */}
        <View style={{ position: 'absolute', top: 10, left: -10, opacity: 0.55 }}>
          <GoldCracks width={130} height={50} opacity={0.5} />
        </View>
        <View style={{ position: 'absolute', bottom: -10, right: -20, opacity: 0.4 }}>
          <GoldCracks width={100} height={40} opacity={0.4} />
        </View>

        {/* Content */}
        <View style={{ zIndex: 2 }}>
          <View style={{
            alignSelf: 'flex-start',
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 10, paddingVertical: 4,
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 999,
          }}>
            <Ionicons name="sparkles" size={10} color="#6B4A9E" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#6B4A9E' }}>มิว Premium</Text>
          </View>
          <Text style={{
            fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 24,
            color: '#2A2320', marginTop: 10, letterSpacing: -0.4, lineHeight: 30,
          }}>
            {'ปลดล็อกพลังทั้งหมด\nของมิวกันเถอะ'}
          </Text>
          <Text style={{
            fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13,
            color: '#6B5F55', marginTop: 6, maxWidth: 210,
          }}>
            บันทึกไม่จำกัด พร้อมฟีเจอร์สุดคุ้มอีก 3 อย่าง
          </Text>
        </View>

        {/* Mascot */}
        <Image
          source={mascotPlus}
          style={{
            position: 'absolute', right: -98, bottom: -19,
            width: 328, height: 188,
            transform: [{ rotate: '-8deg' }],
            zIndex: 1,
          }}
          resizeMode="contain"
        />
      </View>

      {/* Feature list */}
      <View style={{ marginHorizontal: 16, marginBottom: 14, gap: 10 }}>
        {PREMIUM_FEATURES.map((f, i) => (
          <View key={i} style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: '#fff', borderRadius: 20, padding: 14, paddingHorizontal: 16,
            shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 }, elevation: 2,
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: i % 2 === 0 ? '#FCE8D4' : '#D8CCEC',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={f.icon} size={16} color={i % 2 === 0 ? '#C85F28' : '#6B4A9E'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14.5, color: '#2A2320' }}>{f.title}</Text>
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80', marginTop: 2 }}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Pricing cards */}
      <View className="flex-row" style={{ gap: 10, paddingHorizontal: 16, marginBottom: 8 }}>
        {/* Monthly */}
        <Pressable
          onPress={() => setPlan('month')}
          className="flex-1"
          style={{
            padding: 14, paddingBottom: 16, borderRadius: 20,
            borderWidth: 2,
            borderColor: plan === 'month' ? '#E87A3D' : 'rgba(42,35,32,0.08)',
            backgroundColor: plan === 'month' ? '#fff' : 'transparent',
            shadowColor: plan === 'month' ? '#2A2320' : 'transparent',
            shadowOpacity: plan === 'month' ? 0.05 : 0,
            shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
            elevation: plan === 'month' ? 2 : 0,
          }}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>รายเดือน</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#2A2320', marginTop: 4 }}>฿99</Text>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80', marginTop: 2 }}>/ เดือน</Text>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#9A8D80', marginTop: 6 }}>ยกเลิกได้ทุกเมื่อ</Text>
        </Pressable>

        {/* Yearly */}
        <View className="flex-1" style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute', top: -10, right: 10, zIndex: 2,
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
            backgroundColor: '#E8B547',
          }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 10, color: '#2A2320' }}>คุ้มสุด ★</Text>
          </View>
          <Pressable
            onPress={() => setPlan('year')}
            style={{
              padding: 14, paddingBottom: 16, borderRadius: 20,
              borderWidth: 2,
              borderColor: plan === 'year' ? '#E87A3D' : 'rgba(42,35,32,0.08)',
              backgroundColor: plan === 'year' ? '#fff' : 'transparent',
              shadowColor: plan === 'year' ? '#2A2320' : 'transparent',
              shadowOpacity: plan === 'year' ? 0.05 : 0,
              shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
              elevation: plan === 'year' ? 2 : 0,
            }}
          >
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>รายปี</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#2A2320', marginTop: 4 }}>฿899</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80', marginTop: 2 }}>/ ปี</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11, color: '#C85F28', marginTop: 6 }}>ประหยัด 25%</Text>
          </Pressable>
        </View>
      </View>

      {/* CTA Button */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
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
            height: 52, borderRadius: 999,
            backgroundColor: '#E87A3D',
            shadowColor: '#E87A3D', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
            elevation: 8,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, color: '#fff' }}>เริ่มใช้ Premium</Text>
          <Ionicons name="paw" size={14} color="#fff" />
        </Pressable>
      </View>

      {/* Footer */}
      <Text style={{
        fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11,
        textAlign: 'center', color: '#9A8D80',
        paddingHorizontal: 24, paddingTop: 12,
      }}>
        ทดลองฟรี 7 วัน · ยกเลิกได้ก่อนคิดเงิน
      </Text>
    </ScrollView>
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
      <Animated.Text key={stepIndex} entering={FadeIn.duration(400)} style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 16, color: '#2A2320', marginBottom: 4 }}>
        {step.text}
      </Animated.Text>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80', marginBottom: 16 }}>โปรดรอสักครู่</Text>
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
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18, color: '#2A2320' }}>ประวัติการวิเคราะห์</Text>
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
              <Text style={{ fontFamily: filterYear === null ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13, color: filterYear === null ? '#E87A3D' : '#2A2320' }}>ทุกปี</Text>
            </Pressable>
            {years.map(y => (
              <Pressable
                key={y}
                onPress={() => { setFilterYear(y); setFilterMonth(null); }}
                className={`px-3 py-1.5 rounded-full border ${filterYear === y ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <Text style={{ fontFamily: filterYear === y ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13, color: filterYear === y ? '#E87A3D' : '#2A2320' }}>{y + 543}</Text>
              </Pressable>
            ))}
          </View>

          {filterYear !== null && (
            <View className="px-4 pb-2 flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => setFilterMonth(null)}
                className={`px-3 py-1.5 rounded-full border ${filterMonth === null ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <Text style={{ fontFamily: filterMonth === null ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13, color: filterMonth === null ? '#E87A3D' : '#2A2320' }}>ทุกเดือน</Text>
              </Pressable>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <Pressable
                  key={m}
                  onPress={() => setFilterMonth(m)}
                  className={`px-3 py-1.5 rounded-full border ${filterMonth === m ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                >
                  <Text style={{ fontFamily: filterMonth === m ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 12, color: filterMonth === m ? '#E87A3D' : '#2A2320' }}>{THAI_MONTHS_SHORT[m]}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View className="px-4 pb-3 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setFilterWalletId('all')}
              className={`px-3 py-1.5 rounded-full border ${filterWalletId === 'all' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text style={{ fontFamily: filterWalletId === 'all' ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13, color: filterWalletId === 'all' ? '#E87A3D' : '#2A2320' }}>ทุกกระเป๋า</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterWalletId('none')}
              className={`px-3 py-1.5 rounded-full border ${filterWalletId === 'none' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text style={{ fontFamily: filterWalletId === 'none' ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 12, color: filterWalletId === 'none' ? '#E87A3D' : '#2A2320' }}>ไม่ระบุ</Text>
            </Pressable>
            {wallets.map(w => (
              <Pressable
                key={w.id}
                onPress={() => setFilterWalletId(w.id)}
                className={`px-3 py-1.5 rounded-full border ${filterWalletId === w.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <Text style={{ fontFamily: filterWalletId === w.id ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 12, color: filterWalletId === w.id ? '#E87A3D' : '#2A2320' }}>{w.name}</Text>
              </Pressable>
            ))}
          </View>

          {/* List */}
          <ScrollView className="px-4 pb-6">
            {filtered.length === 0 ? (
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80', textAlign: 'center', paddingVertical: 32 }}>ไม่พบประวัติ</Text>
            ) : (
              filtered.map(h => (
                <Pressable
                  key={h.id}
                  onPress={() => { onView(h); onClose(); }}
                  onLongPress={() => onDelete(h)}
                  className="flex-row items-center px-4 py-3 bg-card border-b border-border rounded-xl mb-2"
                >
                  <Ionicons name="document-text-outline" size={20} color="#E87A3D" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: '#2A2320' }}>
                      {getPeriodLabel(h.year, h.month)} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                    </Text>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: '#9A8D80', marginTop: 2 }}>
                      {h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} · {new Date(h.createdAt).toLocaleDateString('th-TH')}
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
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: dataTab === 'export' ? '#fff' : '#9A8D80', marginLeft: 6 }}>ส่งออก</Text>
        </Pressable>
        <Pressable
          onPress={() => { setDataTab('import'); clearFeedback(); }}
          className={`flex-1 flex-row items-center justify-center py-2.5 ${dataTab === 'import' ? 'bg-primary' : 'bg-card'}`}
        >
          <Ionicons name="cloud-download-outline" size={16} color={dataTab === 'import' ? 'white' : '#666'} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: dataTab === 'import' ? '#fff' : '#9A8D80', marginLeft: 6 }}>นำเข้า</Text>
        </Pressable>
      </View>

      {/* Format: TXT / Excel */}
      <View className="flex-row mb-4">
        <Pressable
          onPress={() => { setFormat('txt'); clearFeedback(); }}
          className={`flex-1 items-center py-2 mx-1 rounded-lg border ${format === 'txt' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: format === 'txt' ? '#E87A3D' : '#9A8D80' }}>TXT (JSON)</Text>
        </Pressable>
        <Pressable
          onPress={() => { setFormat('excel'); clearFeedback(); }}
          className={`flex-1 items-center py-2 mx-1 rounded-lg border ${format === 'excel' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: format === 'excel' ? '#E87A3D' : '#9A8D80' }}>Excel (.xlsx)</Text>
        </Pressable>
      </View>

      {dataTab === 'export' ? (
        <View>
          {/* Data counts */}
          <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
            <View className="flex-row items-center mb-3">
              <Ionicons name={format === 'txt' ? 'document-text-outline' : 'grid-outline'} size={20} color="#E87A3D" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, color: '#2A2320', marginLeft: 8 }}>ข้อมูลที่จะส่งออก</Text>
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
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#3b82f6', marginLeft: 8, flex: 1 }}>
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
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#22c55e', marginLeft: 8 }}>ส่งออกข้อมูลเรียบร้อย!</Text>
              </View>
            </View>
          )}
          {exportError && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <View className="flex-row items-start">
                <Ionicons name="close-circle" size={18} color="#ef4444" style={{ marginTop: 1 }} />
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#ef4444', marginLeft: 8, flex: 1 }}>{exportError}</Text>
              </View>
            </View>
          )}

          {/* Export button */}
          <Pressable onPress={handleExport} disabled={loading || !counts}
            className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
            {loading ? <ActivityIndicator color="white" /> : (
              <View className="flex-row items-center">
                <Ionicons name="share-outline" size={20} color="white" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#fff', marginLeft: 8 }}>
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
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, color: '#2A2320', marginLeft: 8 }}>นำเข้าจากไฟล์สำรอง</Text>
            </View>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>
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
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#92400e', marginBottom: 4 }}>หมายเหตุ</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• กระเป๋าที่ชื่อซ้ำจะสร้างเป็นชื่อใหม่ เช่น "เงินสด (2)"</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• ข้อมูลเดิมในแอปจะไม่ถูกลบ</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• หมวดหมู่ default ที่มีอยู่แล้วจะไม่ถูกสร้างซ้ำ</Text>
              </View>
            </View>
          </View>

          {/* Import result */}
          {importResult && importResult.success && (
            <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#15803d', marginLeft: 8 }}>นำเข้าสำเร็จ!</Text>
              </View>
              <View className="gap-1.5">
                <ResultRow label="กระเป๋าเงิน" count={importResult.wallets} extra={importResult.walletsRenamed > 0 ? `เปลี่ยนชื่อ ${importResult.walletsRenamed}` : undefined} />
                <ResultRow label="หมวดหมู่ใหม่" count={importResult.categories} />
                <ResultRow label="ธุรกรรม" count={importResult.transactions} />
                <ResultRow label="การวิเคราะห์" count={importResult.analysis} />
                <ResultRow label="ประวัติ AI" count={importResult.aiHistory} />
                {importResult.settingsRestored && (
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#15803d' }}>✓ คืนค่าตั้งค่าแอปแล้ว</Text>
                )}
              </View>
            </View>
          )}
          {importResult && !importResult.success && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#ef4444', marginLeft: 8 }}>{importResult.error}</Text>
              </View>
            </View>
          )}

          {/* Import button */}
          <Pressable onPress={handleImport} disabled={loading}
            className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, color: '#fff', marginLeft: 8 }}>กำลังนำเข้า...</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="document-attach-outline" size={20} color="white" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#fff', marginLeft: 8 }}>
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
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, color: '#2A2320', marginTop: 12 }}>
              {dataTab === 'export' ? 'กำลังส่งออกข้อมูล...' : 'กำลังนำเข้าข้อมูล...'}
            </Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80', marginTop: 4 }}>กรุณารอสักครู่</Text>
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
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320', marginLeft: 8, flex: 1 }}>{label}</Text>
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#9A8D80' }}>
        {suffix && count > 0 ? suffix : `${count} รายการ`}
      </Text>
    </View>
  );
}

function ResultRow({ label, count, extra }: { label: string; count: number; extra?: string }) {
  return (
    <View className="flex-row items-center">
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#15803d', flex: 1 }}>• {label}</Text>
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#166534' }}>
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
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <PremiumPaywall onUnlock={() => setIsPremium(true)} />
      </SafeAreaView>
    );
  }

  // ===== Premium: show inner tabs =====
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="diamond" size={22} color="#C85F28" />
        <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 26, letterSpacing: -0.4, color: '#2A2320' }}>Premium</Text>
      </View>

      {/* Segmented tab */}
      <View style={{
        marginHorizontal: 16, marginBottom: 14, padding: 4, borderRadius: 14,
        backgroundColor: '#F5EEE0', flexDirection: 'row', gap: 4,
      }}>
        {([['ai', 'sparkles-outline', 'AI วิเคราะห์'], ['data', 'swap-horizontal-outline', 'ข้อมูล']] as const).map(([key, icon, label]) => (
          <Pressable
            key={key}
            onPress={() => setInnerTab(key as InnerTab)}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              backgroundColor: innerTab === key ? '#E87A3D' : 'transparent',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Ionicons name={icon} size={14} color={innerTab === key ? '#fff' : '#9A8D80'} />
            <Text style={{
              fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14.5,
              color: innerTab === key ? '#fff' : '#9A8D80',
            }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {innerTab === 'ai' ? (
          <>
            {!hasApiKey && (
              <View style={{ marginHorizontal: 16, marginBottom: 14, padding: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.08)', flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320', marginLeft: 8, flex: 1 }}>
                  กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อนใช้งาน
                </Text>
              </View>
            )}

            {/* ปี */}
            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, color: '#2A2320', marginBottom: 8 }}>ปี</Text>
              {availableYears.length === 0 ? (
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#F5EEE0' }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80', textAlign: 'center' }}>
                    ยังไม่มีข้อมูลรายการ{selectedWalletId ? 'ในกระเป๋านี้' : ''}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {availableYears.map(y => (
                    <Pressable
                      key={y}
                      onPress={() => handleSelectYear(y)}
                      style={{
                        height: 34, paddingHorizontal: 14, borderRadius: 999,
                        backgroundColor: selectedYear === y ? '#fff' : 'transparent',
                        borderWidth: 1.5,
                        borderColor: selectedYear === y ? '#E87A3D' : '#D9CFC3',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{
                        fontFamily: selectedYear === y ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                        fontSize: 13, color: selectedYear === y ? '#C85F28' : '#9A8D80',
                      }}>{y}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* เดือน */}
            {availableMonths.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, color: '#2A2320', marginBottom: 8 }}>เดือน</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => setSelectedMonth(null)}
                      style={{
                        height: 34, paddingHorizontal: 14, borderRadius: 999,
                        backgroundColor: selectedMonth === null ? '#fff' : 'transparent',
                        borderWidth: 1.5,
                        borderColor: selectedMonth === null ? '#E87A3D' : '#D9CFC3',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{
                        fontFamily: selectedMonth === null ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                        fontSize: 13, color: selectedMonth === null ? '#C85F28' : '#9A8D80',
                      }}>ทั้งปี</Text>
                    </Pressable>
                    {availableMonths.map(m => (
                      <Pressable
                        key={m}
                        onPress={() => setSelectedMonth(m)}
                        style={{
                          height: 34, paddingHorizontal: 14, borderRadius: 999,
                          backgroundColor: selectedMonth === m ? '#fff' : 'transparent',
                          borderWidth: 1.5,
                          borderColor: selectedMonth === m ? '#E87A3D' : '#D9CFC3',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={{
                          fontFamily: selectedMonth === m ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                          fontSize: 13, color: selectedMonth === m ? '#C85F28' : '#9A8D80',
                        }}>{THAI_MONTHS_SHORT[m]}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* กระเป๋าเงิน */}
            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, color: '#2A2320', marginBottom: 8 }}>กระเป๋าเงิน</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => handleSelectWallet(null)}
                    style={{
                      height: 34, paddingHorizontal: 14, borderRadius: 999,
                      backgroundColor: !selectedWalletId ? '#fff' : 'transparent',
                      borderWidth: 1.5,
                      borderColor: !selectedWalletId ? '#E87A3D' : '#D9CFC3',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      fontFamily: !selectedWalletId ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                      fontSize: 13, color: !selectedWalletId ? '#C85F28' : '#9A8D80',
                    }}>ทุกกระเป๋า</Text>
                  </Pressable>
                  {wallets.map(w => (
                    <Pressable
                      key={w.id}
                      onPress={() => handleSelectWallet(w.id)}
                      style={{
                        height: 34, paddingHorizontal: 14, borderRadius: 999,
                        backgroundColor: selectedWalletId === w.id ? '#fff' : 'transparent',
                        borderWidth: 1.5,
                        borderColor: selectedWalletId === w.id ? '#E87A3D' : '#D9CFC3',
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: w.color, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={8} color="#fff" />
                      </View>
                      <Text style={{
                        fontFamily: selectedWalletId === w.id ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                        fontSize: 13, color: selectedWalletId === w.id ? '#C85F28' : '#9A8D80',
                      }}>{w.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* รูปแบบ */}
            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, color: '#2A2320', marginBottom: 8 }}>รูปแบบ</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([['structured', 'วิเคราะห์แบบสรุป'], ['full', 'วิเคราะห์แบบละเอียด']] as const).map(([k, l]) => (
                  <Pressable
                    key={k}
                    onPress={() => setPromptType(k)}
                    style={{
                      flex: 1, height: 44, borderRadius: 12,
                      backgroundColor: promptType === k ? '#E87A3D' : '#fff',
                      borderWidth: 1.5,
                      borderColor: promptType === k ? '#E87A3D' : '#D9CFC3',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14,
                      color: promptType === k ? '#fff' : '#2A2320',
                    }}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* เริ่มวิเคราะห์ */}
            <Pressable
              onPress={handleAnalyze}
              disabled={isLoading || !hasApiKey || availableYears.length === 0}
              style={{
                marginHorizontal: 16, marginTop: 6, marginBottom: 18,
                height: 54, borderRadius: 14,
                backgroundColor: isLoading || !hasApiKey || availableYears.length === 0 ? 'rgba(232,122,61,0.5)' : '#E87A3D',
                shadowColor: '#E87A3D', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                elevation: 8,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isLoading ? <ActivityIndicator color="white" /> : <Ionicons name="sparkles" size={18} color="#fff" />}
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, color: '#fff' }}>
                {isLoading ? 'กำลังวิเคราะห์...' : 'เริ่มวิเคราะห์'}
              </Text>
            </Pressable>

            {isLoading && <View style={{ marginHorizontal: 16 }}><AiLoadingView /></View>}

            {/* ประวัติการวิเคราะห์ */}
            {histories.length > 0 && !isLoading && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#2A2320', flex: 1 }}>ประวัติการวิเคราะห์</Text>
                  {histories.length > 5 && (
                    <Pressable onPress={() => setHistoryModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#E87A3D' }}>ดูทั้งหมด ({histories.length})</Text>
                      <Ionicons name="chevron-forward" size={12} color="#E87A3D" />
                    </Pressable>
                  )}
                </View>
                <View style={{ gap: 10 }}>
                  {recentHistories.map(h => (
                    <Pressable
                      key={h.id}
                      onPress={() => handleViewHistory(h)}
                      onLongPress={() => handleDeleteHistory(h)}
                      style={{
                        backgroundColor: '#fff', borderRadius: 16, padding: 14,
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16,
                        shadowOffset: { width: 0, height: 4 }, elevation: 2,
                      }}
                    >
                      <View style={{
                        width: 30, height: 30, borderRadius: 8,
                        backgroundColor: '#FCE8D4',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name="document-text-outline" size={14} color="#C85F28" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: '#2A2320' }} numberOfLines={1}>
                          {getPeriodLabel(h.year, h.month)} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                        </Text>
                        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: '#9A8D80', marginTop: 2 }}>
                          {h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} · {new Date(h.createdAt).toLocaleDateString('th-TH')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#9A8D80" />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Current Result */}
            {currentResult && !isLoading && (
              <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#2A2320', marginBottom: 10 }}>ผลวิเคราะห์</Text>
                <AiResultView
                  responseType={currentResult.type as any}
                  responseData={currentResult.data}
                  periodLabel={currentResult.periodLabel}
                />
              </View>
            )}
          </>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <DataTransferTab />
          </View>
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
