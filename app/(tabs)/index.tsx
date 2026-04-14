import { FrequentTransactions } from '@/components/transaction/FrequentTransactions';
import { TransactionList } from '@/components/transaction/TransactionList';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { FAB } from '@/components/ui/FAB';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { WalletFilter } from '@/components/wallet/WalletFilter';
import { useSummary } from '@/hooks/useSummary';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import type { Analysis, Transaction } from '@/types';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  const {
    transactions,
    currentPeriod,
    setCurrentPeriod,
    loadTransactions,
    selectedWalletId,
    setSelectedWalletId,
    deleteTransaction,
    setEditingTransaction,
  } = useTransactionStore();

  const categories = useCategoryStore(s => s.categories);
  const analyses = useAnalysisStore(s => s.analyses);

  const filteredTransactions = useMemo(() => {
    if (!selectedWalletId) return transactions;
    return transactions.filter(t => t.walletId === selectedWalletId);
  }, [transactions, selectedWalletId]);

  const { totalIncome, totalExpense } = useSummary(filteredTransactions);
  const { isMonthlyTargetEnabled, monthlyExpenseTarget } = useAlertSettingsStore();

  useEffect(() => {
    loadTransactions(currentPeriod);
  }, [currentPeriod, loadTransactions]);

  const openForm = useCallback(() => {
    router.push('/transaction/add');
  }, []);

  const handleItemPress = useCallback((item: Transaction) => {
    setEditingTransaction(item);
    openForm();
  }, [setEditingTransaction, openForm]);

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
    openForm();
  }, [setEditingTransaction, openForm]);

  const handleFrequentSelect = useCallback((analysis: Analysis) => {
    const cat = categories.find(c => c.id === analysis.categoryId);
    setEditingTransaction({
      id: '', // empty id = pre-fill mode (add, not edit)
      type: analysis.type,
      amount: analysis.amount,
      categoryId: analysis.categoryId,
      walletId: analysis.walletId,
      category: cat,
      note: analysis.note,
      date: new Date().toISOString().split('T')[0],
      createdAt: '',
    });
    openForm();
  }, [categories, setEditingTransaction, openForm]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-2 pb-3 bg-card border-b border-border">
        <PeriodSelector
          period={currentPeriod}
          onChange={setCurrentPeriod}
          className="mb-2"
        />

        <WalletFilter
          selectedWalletId={selectedWalletId}
          onChange={setSelectedWalletId}
          className="mb-2"
        />

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

      {/* Budget Alert */}
      {isMonthlyTargetEnabled && (
        <AlertBanner currentExpense={totalExpense} target={monthlyExpenseTarget} />
      )}

      <FrequentTransactions
        analyses={analyses}
        categories={categories}
        onSelect={handleFrequentSelect}
      />

      <View className="flex-1">
        <TransactionList
          transactions={filteredTransactions}
          onItemPress={handleItemPress}
          onItemLongPress={handleItemLongPress}
        />
      </View>

      <FAB onPress={handleAddNew} />
    </SafeAreaView>
  );
}
