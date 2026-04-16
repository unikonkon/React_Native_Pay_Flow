import { AiResultView } from '@/components/ai/AiResultView';
import { analyzeFinances, getApiKey, getThaiMonthName } from '@/lib/api/ai';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { getAvailableMonths, getAvailableYears, getDb, getTransactionsByRange, getTransactionsByYear } from '@/lib/stores/db';
import { useWalletStore } from '@/lib/stores/wallet-store';
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

type PromptType = 'structured' | 'full';

const THAI_MONTHS_SHORT = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function getPeriodLabel(year: number, month: number | null): string {
  const buddhistYear = year + 543;
  if (month) return `${getThaiMonthName(month)} ${buddhistYear}`;
  return `ปี ${buddhistYear}`;
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
      <Animated.View style={glowStyle} className="mb-4">
        <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center">
          <Ionicons name={step.icon} size={32} color="#0891b2" />
        </View>
      </Animated.View>
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
                  <Ionicons name="document-text-outline" size={20} color="#0891b2" />
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

// ===== Main Screen =====

export default function AiAnalysisScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-foreground text-2xl font-bold mb-4">AI วิเคราะห์การเงิน</Text>

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
          className={`flex-row items-center justify-center py-4 rounded-xl mb-6 ${isLoading || !hasApiKey || availableYears.length === 0 ? 'bg-primary/50' : 'bg-primary'
            }`}
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
                  <Ionicons name="chevron-forward" size={14} color="#0891b2" />
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
                <Ionicons name="document-text-outline" size={20} color="#0891b2" />
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
