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
import { formatMonthYearThai, shiftMonth } from '@/lib/utils/format';
import { getAllTransactions, getDb, getMonthlySummaries } from '@/lib/stores/db';
import { exportToCSV } from '@/lib/utils/export';

type ChartTab = 'overview' | 'category' | 'wallets';

export default function AnalyticsScreen() {
  const { transactions, currentMonth, setCurrentMonth, loadTransactions } = useTransactionStore();
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
    loadTransactions(currentMonth);
  }, [currentMonth, loadTransactions]);

  const handlePrevMonth = () => setCurrentMonth(shiftMonth(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(shiftMonth(currentMonth, 1));

  const [barData, setBarData] = useState<{ labels: string[]; incomeData: number[]; expenseData: number[] }>({
    labels: [], incomeData: [], expenseData: [],
  });

  useEffect(() => {
    const fetchBarData = async () => {
      const months: string[] = [];
      const labels: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = shiftMonth(currentMonth, -i);
        months.push(m);
        labels.push(m.split('-')[1]);
      }
      try {
        const db = getDb();
        const summaries = await getMonthlySummaries(db, months, selectedWalletId ?? undefined);
        setBarData({
          labels,
          incomeData: summaries.map(s => s.income),
          expenseData: summaries.map(s => s.expense),
        });
      } catch {
        setBarData({ labels, incomeData: labels.map(() => 0), expenseData: labels.map(() => 0) });
      }
    };
    fetchBarData();
  }, [currentMonth, selectedWalletId]);

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
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
          <Pressable onPress={handlePrevMonth} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#666" />
          </Pressable>
          <Text className="text-foreground font-bold text-lg">
            {formatMonthYearThai(currentMonth)}
          </Text>
          <Pressable onPress={handleNextMonth} className="p-2">
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </Pressable>
        </View>

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
