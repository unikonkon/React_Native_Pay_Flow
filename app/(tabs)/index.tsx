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
import { getDb, getSummaryByRange } from '@/lib/stores/db';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency, getCurrencyFontSize, getToday } from '@/lib/utils/format';
import type { Analysis, Transaction } from '@/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CAT_INCOME = require('@/assets/summary/cat-income.png');
const CAT_EXPENSE = require('@/assets/summary/cat-expense.png');
const CAT_BALANCE = require('@/assets/summary/cat-balance.png');

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
  const {
    isMonthlyTargetEnabled, monthlyExpenseTarget,
    isDailyTargetEnabled, dailyExpenseTarget,
  } = useAlertSettingsStore();
  const bgMascotId = useThemeStore(s => s.currentBgMascot);
  const mascotRun = getBgMascotSource(bgMascotId);

  const [todayExpense, setTodayExpense] = useState(0);
  const [dismissDaily, setDismissDaily] = useState(false);
  const [dismissMonthly, setDismissMonthly] = useState(false);

  // Refresh today's expense whenever transactions or wallet filter change
  useEffect(() => {
    if (!isDailyTargetEnabled) { setTodayExpense(0); return; }
    let cancelled = false;
    (async () => {
      try {
        const today = getToday();
        const summary = await getSummaryByRange(getDb(), today, today, selectedWalletId);
        if (!cancelled) setTodayExpense(summary.totalExpense);
      } catch {
        if (!cancelled) setTodayExpense(0);
      }
    })();
    return () => { cancelled = true; };
  }, [transactions, selectedWalletId, isDailyTargetEnabled]);

  // Reset dismiss when target changes (so user sees the new threshold)
  useEffect(() => { setDismissDaily(false); }, [dailyExpenseTarget, isDailyTargetEnabled]);
  useEffect(() => { setDismissMonthly(false); }, [monthlyExpenseTarget, isMonthlyTargetEnabled]);

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
      date: getToday(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addTransaction, selectedWalletId]);

  return (
    <WallpaperBackground>
    <SafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="px-4">
        <View className="flex-row items-center mb-2 justify-between">
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
            { label: 'รายรับ', cat: CAT_INCOME, value: totalIncome, color: '#16A34A' },
            { label: 'รายจ่าย', cat: CAT_EXPENSE, value: totalExpense, color: '#DC2626' },
            { label: 'คงเหลือ', cat: CAT_BALANCE, value: net, color: balanceColor },
          ];
          return (
            <View className="flex-row pb-2" style={{ gap: 6 }}>
              {cards.map((c) => (
                <View
                  key={c.label}
                  style={{
                    flex: 1,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    // borderColor: '#D9C9A8',
                    // backgroundColor: '#FBF3E2',
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingHorizontal: 4,
                    alignItems: 'center',
                  }}
                  className="border-b border-border"
                >
                  <View
                    style={{
                      // backgroundColor: '#F4E4C0',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 3,
                      marginBottom: 4,
                    }}
                    className="bg-accent"
                  >
                    <Text
                      style={{
                        fontFamily: 'IBMPlexSansThai_700Bold',
                        fontSize: 15,
                        // color: '#6B4A2B',
                      }}
                      className="text-foreground"
                    >
                      {c.label}
                    </Text>
                  </View>
                  <Image
                    source={c.cat}
                    style={{ width: 78, height: 58, marginVertical: 2 }}
                    resizeMode="contain"
                  />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    style={{
                      fontFamily: 'Inter_700Bold',
                      fontSize: getCurrencyFontSize(c.value, 22),
                      fontVariant: ['tabular-nums'],
                      letterSpacing: -0.4,
                      color: c.color,
                      marginTop: 2,
                    }}
                  >
                    {formatCurrency(c.value)}
                  </Text>
                </View>
              ))}
            </View>
          );
        })()}
      </View>

      {/* Budget Alerts */}
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

      <FrequentTransactions
        onSelect={handleFrequentSelect}
      />

      {/* `flex-1` is what keeps the SectionList constrained to the
          remaining space above the bottom tab bar. Without it, the list
          renders at its natural (unbounded) height and the bottom rows
          end up hidden under the tab bar from `(tabs)/_layout.tsx`. */}
      <View className="flex-1">
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
    </WallpaperBackground>
  );
}
