import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { useSummary } from '@/hooks/useSummary';
import { BalanceCard } from '@/components/summary/BalanceCard';
import { PieChartView } from '@/components/summary/PieChartView';
import { BarChartView } from '@/components/summary/BarChartView';
import { formatMonthYearThai, shiftMonth, getCurrentMonth } from '@/utils/date';
import { getAllTransactions } from '@/db/queries/transactions';
import { getDb } from '@/hooks/useDatabase';
import { exportToCSV } from '@/utils/export';

type ChartTab = 'overview' | 'category';

export default function SummaryScreen() {
  const { transactions, currentMonth, setCurrentMonth, loadTransactions } = useTransactionStore();
  const { totalIncome, totalExpense, balance, expenseByCategory } = useSummary(transactions);
  const [chartTab, setChartTab] = useState<ChartTab>('overview');

  useEffect(() => {
    loadTransactions(currentMonth);
  }, [currentMonth, loadTransactions]);

  const handlePrevMonth = () => setCurrentMonth(shiftMonth(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(shiftMonth(currentMonth, 1));

  // Build last 6 months bar chart data
  const barData = useMemo(() => {
    const months: string[] = [];
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = shiftMonth(currentMonth, -i);
      months.push(m);
      labels.push(m.split('-')[1]);
    }

    const expenseData = months.map(m => {
      if (m === currentMonth) return totalExpense;
      return 0;
    });

    const incomeData = months.map(m => {
      if (m === currentMonth) return totalIncome;
      return 0;
    });

    return { labels, incomeData, expenseData };
  }, [currentMonth, totalIncome, totalExpense]);

  const handleExport = async () => {
    try {
      const db = getDb();
      const allTx = await getAllTransactions(db);
      await exportToCSV(allTx);
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView>
        {/* Month Selector */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
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

        {/* Balance Card */}
        <BalanceCard
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
        />

        {/* Chart Tab Switch */}
        <View className="flex-row mx-4 mb-4 rounded-xl overflow-hidden border border-border">
          <Pressable
            onPress={() => setChartTab('overview')}
            className={`flex-1 py-2.5 items-center ${chartTab === 'overview' ? 'bg-primary' : 'bg-card'}`}
          >
            <Text className={`font-semibold ${chartTab === 'overview' ? 'text-primary-foreground' : 'text-foreground'}`}>
              รายรับ/รายจ่าย
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setChartTab('category')}
            className={`flex-1 py-2.5 items-center ${chartTab === 'category' ? 'bg-primary' : 'bg-card'}`}
          >
            <Text className={`font-semibold ${chartTab === 'category' ? 'text-primary-foreground' : 'text-foreground'}`}>
              รายหมวด
            </Text>
          </Pressable>
        </View>

        {/* Charts */}
        {chartTab === 'overview' ? (
          <BarChartView
            labels={barData.labels}
            incomeData={barData.incomeData}
            expenseData={barData.expenseData}
          />
        ) : (
          <PieChartView data={expenseByCategory} title="สัดส่วนรายจ่ายตามหมวดหมู่" />
        )}

        {/* Export Button */}
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
