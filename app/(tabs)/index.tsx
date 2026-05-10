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
import { formatCurrency, getToday } from '@/lib/utils/format';
import type { Analysis, Transaction } from '@/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

// Tiny meaningful icons next to each summary label:
//  • TrendUpIcon — line trending ↗ for "รายรับ" (income)
//  • TrendDownIcon — line trending ↘ for "รายจ่าย" (expense)
//  • WalletIcon — wallet silhouette w/ cat-ear flick for "คงเหลือ" (remaining)
// Color is passed in so the balance icon can flip green/red with its value.

function TrendUpIcon({ size = 13, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M2.5 12 L6.5 7.5 L9 10 L13.5 4.5"
        stroke={color} strokeWidth={1.8} fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M10.5 4.5 L13.7 4.5 L13.7 7.6"
        stroke={color} strokeWidth={1.8} fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrendDownIcon({ size = 13, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M2.5 4.5 L6.5 9 L9 6.5 L13.5 12"
        stroke={color} strokeWidth={1.8} fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M10.5 12 L13.7 12 L13.7 8.9"
        stroke={color} strokeWidth={1.8} fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ size = 13, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      {/* Cat-ear flick on the wallet's top-left, matching the app's mascot motif */}
      <Path d="M3 5 L2.4 2.2 L4.8 3.5 Z" fill={color} />
      {/* Wallet body w/ cut-out for the coin pocket on the right edge */}
      <Path
        d="M2 5.2 L2 13 A1 1 0 0 0 3 14 L13 14 A1 1 0 0 0 14 13 L14 9.5 L11 9.5 A1.6 1.6 0 0 1 11 6.3 L14 6.3 L14 5.2 A1 1 0 0 0 13 4.2 L3 4.2 A1 1 0 0 0 2 5.2 Z"
        fill={color}
      />
      {/* Coin highlight inside the pocket */}
      <Circle cx={11.4} cy={7.9} r={0.7} fill="#FBF7F0" />
    </Svg>
  );
}

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

        {/* Summary row — larger numbers like prototype, w/ a tiny meaning
            icon next to each label (trending-up for income, trending-down
            for expense, wallet for what's left). The balance icon flips
            green/red along with its number when net dips below zero. */}
        <View className="flex-row justify-around pb-2">
          <View className="items-center flex-1">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TrendUpIcon size={13} color="#16A34A" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">รายรับ</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, fontVariant: ['tabular-nums'], letterSpacing: -0.4 }} className="text-income">{formatCurrency(totalIncome)}</Text>
          </View>
          <View className="items-center flex-1">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TrendDownIcon size={13} color="#DC2626" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">รายจ่าย</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, fontVariant: ['tabular-nums'], letterSpacing: -0.4 }} className="text-expense">{formatCurrency(totalExpense)}</Text>
          </View>
          <View className="items-center flex-1">
            {(() => {
              const net = totalIncome - totalExpense;
              const balanceColor = net >= 0 ? '#166534' : '#991B1B';
              return (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <WalletIcon size={13} color={balanceColor} />
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">คงเหลือ</Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Inter_700Bold',
                      fontSize: 20,
                      fontVariant: ['tabular-nums'],
                      letterSpacing: -0.4,
                      color: balanceColor,
                      textShadowColor: 'rgba(0,0,0,0.09)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}
                  >
                    {formatCurrency(net)}
                  </Text>
                </>
              );
            })()}
          </View>
        </View>
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
