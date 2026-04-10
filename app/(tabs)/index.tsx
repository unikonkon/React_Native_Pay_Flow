import { TransactionForm } from '@/components/transaction/TransactionForm';
import { TransactionList } from '@/components/transaction/TransactionList';
import { FrequentTransactions } from '@/components/transaction/FrequentTransactions';
import { FAB } from '@/components/ui/FAB';
import { useSummary } from '@/hooks/useSummary';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import type { Analysis, Transaction } from '@/types';
import { formatCurrency, formatMonthYearThai, shiftMonth } from '@/lib/utils/format';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const {
    transactions,
    currentMonth,
    setCurrentMonth,
    loadTransactions,
    deleteTransaction,
  } = useTransactionStore();

  const categories = useCategoryStore(s => s.categories);
  const { analyses, loadAnalysis } = useAnalysisStore();
  const { totalIncome, totalExpense } = useSummary(transactions);

  useEffect(() => {
    loadTransactions(currentMonth);
  }, [currentMonth, loadTransactions]);

  const handlePrevMonth = () => setCurrentMonth(shiftMonth(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(shiftMonth(currentMonth, 1));

  const handleItemPress = useCallback((item: Transaction) => {
    setEditingTransaction(item);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

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

  const handleAddNew = useCallback(() => {
    setEditingTransaction(null);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleFrequentSelect = useCallback((analysis: Analysis) => {
    const cat = categories.find(c => c.id === analysis.categoryId);
    setEditingTransaction({
      id: '',
      type: analysis.type,
      amount: analysis.amount,
      categoryId: analysis.categoryId,
      walletId: analysis.walletId,
      category: cat,
      note: analysis.note,
      date: new Date().toISOString().split('T')[0],
      createdAt: '',
    });
    bottomSheetRef.current?.snapToIndex(0);
  }, [categories]);

  const handleFormDismiss = useCallback(() => {
    setEditingTransaction(null);
    loadAnalysis();
  }, [loadAnalysis]);

  const formEditTransaction = editingTransaction?.id ? editingTransaction : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
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

      <FrequentTransactions
        analyses={analyses}
        categories={categories}
        onSelect={handleFrequentSelect}
      />

      <View className="flex-1">
        <TransactionList
          transactions={transactions}
          onItemPress={handleItemPress}
          onItemLongPress={handleItemLongPress}
        />
      </View>

      <FAB onPress={handleAddNew} />

      <TransactionForm
        bottomSheetRef={bottomSheetRef}
        editTransaction={formEditTransaction}
        onDismiss={handleFormDismiss}
      />
    </SafeAreaView>
  );
}
