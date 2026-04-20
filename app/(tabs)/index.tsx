import { FrequentTransactions } from '@/components/transaction/FrequentTransactions';
import { TransactionList } from '@/components/transaction/TransactionList';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { FAB } from '@/components/ui/FAB';

import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { WalletFilter } from '@/components/wallet/WalletFilter';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import type { Analysis, Transaction } from '@/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mascotRun = require('@/assets/mascot-run.png');

export default function TransactionsScreen() {
  const transactions = useTransactionStore(s => s.transactions);
  const currentPeriod = useTransactionStore(s => s.currentPeriod);
  const setCurrentPeriod = useTransactionStore(s => s.setCurrentPeriod);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
  const setSelectedWalletId = useTransactionStore(s => s.setSelectedWalletId);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);
  const deleteTransactions = useTransactionStore(s => s.deleteTransactions);
  const setEditingTransaction = useTransactionStore(s => s.setEditingTransaction);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const totalIncome = useTransactionStore(s => s.totalIncome);
  const totalExpense = useTransactionStore(s => s.totalExpense);

  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const { isMonthlyTargetEnabled, monthlyExpenseTarget } = useAlertSettingsStore();

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

  // Reload frequent analyses only when wallet filter changes
  useEffect(() => {
    loadAnalysis(selectedWalletId);
  }, [selectedWalletId, loadAnalysis]);

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

  const handleDeleteItem = useCallback((item: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleDeleteGroup = useCallback((items: Transaction[]) => {
    Alert.alert(
      'ลบรายการทั้งกลุ่ม',
      `ต้องการลบทั้ง ${items.length} รายการ?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบทั้งหมด',
          style: 'destructive',
          onPress: () => deleteTransactions(items.map(i => i.id)),
        },
      ]
    );
  }, [deleteTransactions]);

  const handleCopyItem = useCallback((item: Transaction) => {
    const copy = { ...item, id: '' } as Transaction;
    setEditingTransaction(copy);
    openForm();
  }, [setEditingTransaction, openForm]);

  const handleAddNew = useCallback(() => {
    setEditingTransaction(null);
    openForm();
  }, [setEditingTransaction, openForm]);

  const handleFrequentSelect = useCallback(async (analysis: Analysis) => {
    await addTransaction({
      type: analysis.type,
      amount: analysis.amount,
      categoryId: analysis.categoryId,
      walletId: selectedWalletId ?? analysis.walletId,
      note: analysis.note,
      date: new Date().toISOString().split('T')[0],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addTransaction, selectedWalletId]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-1">
        <View className="flex-row items-center mb-2">
          <Image source={mascotRun} style={{ width: 44, height: 34 }} resizeMode="contain" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 22, letterSpacing: -0.2 }} className="text-foreground ml-2">รายการ</Text>
        </View>

        {/* Wallet + Month row */}
        <View className="flex-row items-center justify-between mb-3">
          <WalletFilter
            selectedWalletId={selectedWalletId}
            onChange={setSelectedWalletId}
            className=""
          />
          <PeriodSelector
            period={currentPeriod}
            onChange={setCurrentPeriod}
            className=""
          />
        </View>

        {/* Summary row — larger numbers like prototype */}
        <View className="flex-row justify-around pb-3">
          <View className="items-center flex-1">
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground mb-1">รายรับ</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, fontVariant: ['tabular-nums'], letterSpacing: -0.4 }} className="text-income">{formatCurrency(totalIncome)}</Text>
          </View>
          <View className="items-center flex-1">
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground mb-1">รายจ่าย</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, fontVariant: ['tabular-nums'], letterSpacing: -0.4 }} className="text-expense">{formatCurrency(totalExpense)}</Text>
          </View>
          <View className="items-center flex-1">
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground mb-1">คงเหลือ</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, fontVariant: ['tabular-nums'], letterSpacing: -0.4 }} className={totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense'}>{formatCurrency(totalIncome - totalExpense)}</Text>
          </View>
        </View>
      </View>

      {/* Budget Alert */}
      {isMonthlyTargetEnabled && (
        <AlertBanner currentExpense={totalExpense} target={monthlyExpenseTarget} />
      )}

      <FrequentTransactions
        onSelect={handleFrequentSelect}
      />

      <View className="">
        <TransactionList
          transactions={transactions}
          onItemPress={handleItemPress}
          onItemLongPress={handleItemLongPress}
          onDeleteItem={handleDeleteItem}
          onDeleteGroup={handleDeleteGroup}
          onCopyItem={handleCopyItem}
        />
      </View>

      <FAB onPress={handleAddNew} />
    </SafeAreaView>
  );
}
