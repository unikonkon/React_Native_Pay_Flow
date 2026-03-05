import { TransactionForm } from '@/components/transaction/TransactionForm';
import { TransactionList } from '@/components/transaction/TransactionList';
import { FAB } from '@/components/ui/FAB';
import { useSummary } from '@/hooks/useSummary';
import { useTransactionStore } from '@/stores/transactionStore';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatMonthYearThai, shiftMonth } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {
    transactions,
    currentMonth,
    setCurrentMonth,
    loadTransactions,
    deleteTransaction,
  } = useTransactionStore();

  const { totalIncome, totalExpense } = useSummary(transactions);

  useEffect(() => {
    loadTransactions(currentMonth);
  }, [currentMonth, loadTransactions]);

  const handlePrevMonth = () => setCurrentMonth(shiftMonth(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(shiftMonth(currentMonth, 1));

  const handleItemLongPress = useCallback((item: Transaction) => {
    Alert.alert(
      'ลบรายการ',
      `ต้องการลบ "${item.category?.name}" ${formatCurrency(item.amount)} ?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => deleteTransaction(item.id),
        },
      ]
    );
  }, [deleteTransaction]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Month Selector + Quick Summary */}
      <View className="px-4 pt-2 pb-3 bg-card border-b border-border">
        <View className="flex-row items-center justify-between mb-2">
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

        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">รายรับ</Text>
            <Text className="text-income font-bold text-base">{formatCurrency(totalIncome)}</Text>
          </View>
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">รายจ่าย</Text>
            <Text className="text-expense font-bold text-base">{formatCurrency(totalExpense)}</Text>
          </View>
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">คงเหลือ</Text>
            <Text className={`font-bold text-base ${totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <View className="flex-1">
        <TransactionList
          transactions={transactions}
          onItemLongPress={handleItemLongPress}
        />
      </View>

      {/* FAB */}
      <FAB onPress={() => bottomSheetRef.current?.snapToIndex(0)} />

      {/* Bottom Sheet Form */}
      <TransactionForm bottomSheetRef={bottomSheetRef} />
    </SafeAreaView>
  );
}
