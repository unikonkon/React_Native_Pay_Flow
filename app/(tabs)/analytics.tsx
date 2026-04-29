import { PieChartView } from '@/components/analytics/PieChartView';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { WalletFilter } from '@/components/wallet/WalletFilter';
import { useSummary } from '@/hooks/useSummary';
import { getBgMascotSource } from '@/lib/constants/mascots';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ViewType = 'expense' | 'income' | 'all';

export default function AnalyticsScreen() {
  const transactions = useTransactionStore(s => s.transactions);
  const currentPeriod = useTransactionStore(s => s.currentPeriod);
  const setCurrentPeriod = useTransactionStore(s => s.setCurrentPeriod);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
  const setSelectedWalletId = useTransactionStore(s => s.setSelectedWalletId);
  const [viewType, setViewType] = useState<ViewType>('expense');
  const bgMascotId = useThemeStore(s => s.currentBgMascot);
  const mascotRun = getBgMascotSource(bgMascotId);

  const { expenseByCategory, incomeByCategory, balance } = useSummary(transactions);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadTransactions(currentPeriod);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentPeriod, loadTransactions]);

  const allByCategory = useMemo(() => {
    const map = new Map<string, typeof expenseByCategory[number]>();
    for (const item of [...expenseByCategory, ...incomeByCategory]) {
      const existing = map.get(item.categoryId);
      if (existing) {
        existing.total += item.total;
        existing.count += item.count;
      } else {
        map.set(item.categoryId, { ...item });
      }
    }
    const result = Array.from(map.values());
    const grandTotal = result.reduce((s, r) => s + r.total, 0);
    for (const r of result) {
      r.percentage = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
    }
    return result.sort((a, b) => b.total - a.total);
  }, [expenseByCategory, incomeByCategory]);

  const data = viewType === 'expense' ? expenseByCategory : viewType === 'income' ? incomeByCategory : allByCategory;
  const title = viewType === 'expense' ? 'สัดส่วนรายจ่ายตามหมวดหมู่' : viewType === 'income' ? 'สัดส่วนรายรับตามหมวดหมู่' : 'สัดส่วนรวมตามหมวดหมู่';
  const filterMin = viewType === 'all' ? 0 : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View className="px-4 mb-2">
          <View className="flex-row items-center mb-2 justify-between">
            <View className="flex-row items-center">
              <Image source={mascotRun} style={{ width: 50, height: 34 }} resizeMode="contain" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 22, letterSpacing: -0.2 }} className="text-foreground ml-2">สรุป</Text>
            </View>
            {/* Wallet filter */}
            <WalletFilter
              selectedWalletId={selectedWalletId}
              onChange={setSelectedWalletId}
              className=""
            />
          </View>     
        </View>

        {/* Period selector + expense/income toggle */}
        <View style={{ paddingHorizontal: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <View style={{ flex: 1 }}>
            <PeriodSelector
              period={currentPeriod}
              onChange={setCurrentPeriod}
              className=""
            />
          </View>
          {/* Expense / Income / All toggle */}
          <View className="flex-row bg-white rounded-full border border-border overflow-hidden">
            {([
              ['expense', 'จ่าย', '#C65A4E'],
              ['income', 'รับ', '#3E8B68'],
              ['all', 'คงเหลือ', '#2B2118'],
            ] as const).map(([key, label, accent]) => {
              const active = viewType === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => { Haptics.selectionAsync(); setViewType(key); }}
                  style={{ backgroundColor: active ? accent : 'transparent' }}
                  className="px-2 py-2 rounded-full"
                >
                  <Text style={{
                    fontFamily: 'IBMPlexSansThai_600SemiBold',
                    fontSize: 13,
                    paddingHorizontal: 6,
                    color: active ? '#fff' : key === 'all' ? '#6B5F52' : accent,
                  }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PieChartView
          data={data}
          title={title}
          minPercentage={filterMin}
          period={currentPeriod}
          walletId={selectedWalletId}
          viewType={viewType}
          netAmount={viewType === 'all' ? balance : undefined}
        />

      </ScrollView>
    </SafeAreaView>
  );
}
