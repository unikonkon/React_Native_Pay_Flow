import { BalanceCard } from '@/components/analytics/BalanceCard';
import { BarChartView } from '@/components/analytics/BarChartView';
import { PieChartView } from '@/components/analytics/PieChartView';
import { WalletsContent } from '@/components/analytics/WalletsContent';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { WalletFilter } from '@/components/wallet/WalletFilter';
import { useSummary } from '@/hooks/useSummary';
import { getAllTransactions, getDb, getSummariesByBuckets } from '@/lib/stores/db';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { exportToCSV } from '@/lib/utils/export';
import { getBarChartBuckets } from '@/lib/utils/period';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ChartTab = 'overview' | 'category' | 'wallets';

export default function AnalyticsScreen() {
  const transactions = useTransactionStore(s => s.transactions);
  const currentPeriod = useTransactionStore(s => s.currentPeriod);
  const setCurrentPeriod = useTransactionStore(s => s.setCurrentPeriod);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
  const setSelectedWalletId = useTransactionStore(s => s.setSelectedWalletId);
  const totalIncome = useTransactionStore(s => s.totalIncome);
  const totalExpense = useTransactionStore(s => s.totalExpense);

  const wallets = useWalletStore(s => s.wallets);
  const [chartTab, setChartTab] = useState<ChartTab>('category');

  const balance = totalIncome - totalExpense;
  const { expenseByCategory } = useSummary(transactions);

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

  const [barData, setBarData] = useState<{ labels: string[]; incomeData: number[]; expenseData: number[] }>({
    labels: [], incomeData: [], expenseData: [],
  });

  useEffect(() => {
    const fetchBarData = async () => {
      const buckets = getBarChartBuckets(currentPeriod);
      const labels = buckets.map(b => b.label);
      try {
        const db = getDb();
        const rows = await getSummariesByBuckets(db, buckets, selectedWalletId ?? undefined);
        setBarData({
          labels,
          incomeData: rows.map(r => r.income),
          expenseData: rows.map(r => r.expense),
        });
      } catch {
        setBarData({ labels, incomeData: labels.map(() => 0), expenseData: labels.map(() => 0) });
      }
    };
    fetchBarData();
  }, [currentPeriod, selectedWalletId]);

  const handleExport = async () => {
    try {
      const db = getDb();
      const allTx = await getAllTransactions(db);
      await exportToCSV(allTx);
    } catch {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView>
        <PeriodSelector
          period={currentPeriod}
          onChange={setCurrentPeriod}
          className="px-4 pt-2 pb-1"
        />

        <WalletFilter
          selectedWalletId={selectedWalletId}
          onChange={setSelectedWalletId}
          className="px-4 pb-3"
        />

        <BalanceCard totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} />

        <View className="flex-row mx-4 mb-4 rounded-xl overflow-hidden border border-border">
          {(['overview', 'category', 'wallets'] as ChartTab[]).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setChartTab(tab)}
              className={`flex-1 py-2.5 items-center ${chartTab === tab ? 'bg-primary' : 'bg-card'}`}
            >
              <Text className={`font-semibold text-xs ${chartTab === tab ? 'text-primary-foreground' : 'text-foreground'}`}>
                {tab === 'overview' ? 'รายรับ/รายจ่าย' : tab === 'category' ? 'รายหมวด' : 'กระเป๋า'}
              </Text>
            </Pressable>
          ))}
        </View>

        {chartTab === 'overview' && (
          <BarChartView labels={barData.labels} incomeData={barData.incomeData} expenseData={barData.expenseData} />
        )}
        {chartTab === 'category' && (
          <PieChartView data={expenseByCategory} title="สัดส่วนรายจ่ายตามหมวดหมู่" />
        )}
        {chartTab === 'wallets' && (
          <WalletsContent wallets={wallets} transactions={transactions} />
        )}

        <Pressable
          onPress={handleExport}
          className="flex-row items-center justify-center mx-4 my-6 py-3 bg-secondary rounded-xl border border-border"
        >
          <Ionicons name="download-outline" size={20} color="#666" />
          <Text className="text-foreground font-semibold ml-2">ส่งออก Excel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
