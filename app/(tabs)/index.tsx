import { WallpaperBackground } from '@/components/layout/WallpaperBackground';
import { FrequentTransactions } from '@/components/transaction/FrequentTransactions';
import { TransactionList } from '@/components/transaction/TransactionList';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { FAB } from '@/components/ui/FAB';

import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { WalletFilter } from '@/components/wallet/WalletFilter';
import { getBgMascotSource } from '@/lib/constants/mascots';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { getPeriodRange } from '@/lib/utils/period';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency, getToday } from '@/lib/utils/format';
import type { Analysis, Transaction } from '@/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CAT_INCOME = require('@/assets/summary/cat-income.png');
const CAT_EXPENSE = require('@/assets/summary/cat-expense.png');
const CAT_BALANCE = require('@/assets/summary/cat-balance.png');

export default function TransactionsScreen() {
  const transactions = useTransactionStore(s => s.transactions);
  const currentPeriod = useTransactionStore(s => s.currentPeriod);
  const setCurrentPeriod = useTransactionStore(s => s.setCurrentPeriod);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
  const isLoading = useTransactionStore(s => s.isLoading);
  const setSelectedWalletId = useTransactionStore(s => s.setSelectedWalletId);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);
  const deleteTransactions = useTransactionStore(s => s.deleteTransactions);
  const setEditingTransaction = useTransactionStore(s => s.setEditingTransaction);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const totalIncome = useTransactionStore(s => s.totalIncome);
  const totalExpense = useTransactionStore(s => s.totalExpense);

  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const isMonthlyTargetEnabled = useAlertSettingsStore(s => s.isMonthlyTargetEnabled);
  const monthlyExpenseTarget = useAlertSettingsStore(s => s.monthlyExpenseTarget);
  const isDailyTargetEnabled = useAlertSettingsStore(s => s.isDailyTargetEnabled);
  const dailyExpenseTarget = useAlertSettingsStore(s => s.dailyExpenseTarget);
  const bgMascotId = useThemeStore(s => s.currentBgMascot);
  const mascotRun = getBgMascotSource(bgMascotId);

  const [dismissDaily, setDismissDaily] = useState(false);
  const [dismissMonthly, setDismissMonthly] = useState(false);

  // Today's expense — derived ONLY from in-memory transactions. If today is
  // outside the currently-loaded period (user paged to a past/future month),
  // we keep it at 0 instead of issuing a separate SQL query — the daily banner
  // is only meaningful for the live "today" view anyway.
  const [todayExpense, setTodayExpense] = useState(0);
  useEffect(() => {
    if (!isDailyTargetEnabled) { setTodayExpense(0); return; }
    const today = getToday();
    const { start, end } = getPeriodRange(currentPeriod);
    if (today < start || today > end) { setTodayExpense(0); return; }
    let sum = 0;
    for (const t of transactions) {
      if (t.type === 'expense' && t.date === today) sum += t.amount;
    }
    setTodayExpense(sum);
  }, [transactions, currentPeriod, isDailyTargetEnabled]);

  // Reset dismiss when target changes (so user sees the new threshold)
  useEffect(() => { setDismissDaily(false); }, [dailyExpenseTarget, isDailyTargetEnabled]);
  useEffect(() => { setDismissMonthly(false); }, [monthlyExpenseTarget, isMonthlyTargetEnabled]);

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
      date: getToday(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addTransaction, selectedWalletId]);

  return (
    <WallpaperBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image source={mascotRun} style={{ width: 50, height: 34 }} resizeMode="contain" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 22, letterSpacing: -0.2 }} className="text-foreground ml-2">รายการ</Text>
            </View>
            {/* Wallet filter */}
            <WalletFilter
              selectedWalletId={selectedWalletId}
              onChange={setSelectedWalletId}
              className=""
            />
          </View>

          {/* Month row */}
          <View className="flex-row items-center mb-1">
            <View className="flex-1">
              <PeriodSelector
                period={currentPeriod}
                onChange={setCurrentPeriod}
                className=""
                typeUI='full'
                isLoading={isLoading}
              />
            </View>
          </View>

          {/* Summary row — three rounded cards, each w/ a pill label up top,
            a cat illustration in the middle, and a big colored number at
            the bottom. The balance number flips green/red w/ its sign. */}
          {(() => {
            const net = totalIncome - totalExpense;
            const balanceColor = net >= 0 ? '#16A34A' : '#DC2626';
            const cards = [
              { label: 'รายรับ', cat: CAT_INCOME, value: totalIncome, color: '#16A34A', view: 'income' as const },
              { label: 'รายจ่าย', cat: CAT_EXPENSE, value: totalExpense, color: '#DC2626', view: 'expense' as const },
              { label: 'คงเหลือ', cat: CAT_BALANCE, value: net, color: balanceColor, view: 'all' as const },
            ];
            return (
              <View className="flex-row pb-2 gap-2">
                {cards.map((c) => (
                  <Pressable
                    key={c.label}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push({ pathname: '/(tabs)/analytics', params: { view: c.view } });
                    }}
                    className="flex-1 border-border border-2 rounded-3xl pb-2 pt-0.5 items-center justify-center"
                  >
                    <View>
                      <Text
                        style={{
                          fontFamily: 'IBMPlexSansThai_700Bold',
                          fontSize: 15,
                        }}
                        className="text-foreground"
                      >
                        {c.label}
                      </Text>
                    </View>
                    <Image
                      source={c.cat}
                      style={{ width: 78, height: 58 }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        fontFamily: 'Inter_700Bold',
                        fontSize: Math.abs(c.value) > 999999 ? 19 : 20,
                        fontVariant: ['tabular-nums'],
                        letterSpacing: -0.4,
                        color: c.color,
                      }}
                    >
                      {formatCurrency(c.value)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          })()}

        </View>

        <TransactionList
          transactions={transactions}
          onItemPress={handleItemPress}
          onItemLongPress={handleItemLongPress}
          onDeleteItem={handleDeleteItem}
          onDeleteGroup={handleDeleteGroup}
          onCopyItem={handleCopyItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View>
              {isDailyTargetEnabled && !dismissDaily && (
                <AlertBanner
                  scope="daily"
                  currentExpense={todayExpense}
                  target={dailyExpenseTarget}
                  onDismiss={() => setDismissDaily(true)}
                />
              )}
              {isMonthlyTargetEnabled && !dismissMonthly && (
                <AlertBanner
                  scope="monthly"
                  currentExpense={totalExpense}
                  target={monthlyExpenseTarget}
                  onDismiss={() => setDismissMonthly(true)}
                />
              )}
              <FrequentTransactions onSelect={handleFrequentSelect} />
            </View>
          }
        />

        {/* {isLoading && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              alignItems: 'center',
              paddingTop: 100,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(43,33,24,0.85)',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color="#fff" />
              <Text
                style={{
                  fontFamily: 'IBMPlexSansThai_500Medium',
                  fontSize: 12,
                  color: '#fff',
                }}
              >
                กำลังโหลด...
              </Text>
            </View>
          </View>
        )} */}

        <FAB onPress={handleAddNew} />
      </SafeAreaView>
    </WallpaperBackground>
  );
}
