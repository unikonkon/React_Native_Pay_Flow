import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useSummary } from '@/hooks/useSummary';
import { BalanceCard } from '@/components/analytics/BalanceCard';
import { PieChartView } from '@/components/analytics/PieChartView';
import { BarChartView } from '@/components/analytics/BarChartView';
import { WalletsContent } from '@/components/analytics/WalletsContent';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { getBarChartBuckets } from '@/lib/utils/period';
import { getAllTransactions, getDb, getSummariesByBuckets } from '@/lib/stores/db';
import { exportToCSV } from '@/lib/utils/export';

type ChartTab = 'overview' | 'category' | 'wallets';

export default function AnalyticsScreen() {
  const { transactions, currentPeriod, setCurrentPeriod, loadTransactions } = useTransactionStore();
  const wallets = useWalletStore(s => s.wallets);
  const [chartTab, setChartTab] = useState<ChartTab>('overview');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [walletFilterOpen, setWalletFilterOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (!selectedWalletId) return transactions;
    return transactions.filter(t => t.walletId === selectedWalletId);
  }, [transactions, selectedWalletId]);

  const { totalIncome, totalExpense, balance, expenseByCategory } = useSummary(filteredTransactions);

  useEffect(() => {
    loadTransactions(currentPeriod);
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

  const selectedWalletName = selectedWalletId
    ? wallets.find(w => w.id === selectedWalletId)?.name ?? 'กระเป๋า'
    : 'ทุกกระเป๋า';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView>
        <PeriodSelector
          period={currentPeriod}
          onChange={setCurrentPeriod}
          className="px-4 pt-2 pb-1"
        />

        <View className="px-4 pb-3">
          <Pressable
            onPress={() => setWalletFilterOpen(!walletFilterOpen)}
            className="flex-row items-center px-3 py-2 bg-secondary rounded-lg self-start"
          >
            <Ionicons name="wallet-outline" size={16} color="#666" />
            <Text className="text-foreground text-sm ml-1">{selectedWalletName}</Text>
            <Ionicons name="chevron-down" size={14} color="#666" style={{ marginLeft: 4 }} />
          </Pressable>
          {walletFilterOpen && (
            <View className="mt-2 bg-card rounded-xl border border-border overflow-hidden">
              <Pressable
                onPress={() => { setSelectedWalletId(null); setWalletFilterOpen(false); }}
                className={`px-4 py-3 border-b border-border ${!selectedWalletId ? 'bg-primary/10' : ''}`}
              >
                <Text className={`${!selectedWalletId ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  ทุกกระเป๋า
                </Text>
              </Pressable>
              {wallets.map(w => (
                <Pressable
                  key={w.id}
                  onPress={() => { setSelectedWalletId(w.id); setWalletFilterOpen(false); }}
                  className={`flex-row items-center px-4 py-3 border-b border-border ${selectedWalletId === w.id ? 'bg-primary/10' : ''}`}
                >
                  <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: w.color }}>
                    <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={12} color="white" />
                  </View>
                  <Text className={`${selectedWalletId === w.id ? 'text-primary font-semibold' : 'text-foreground'}`}>
                    {w.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

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
