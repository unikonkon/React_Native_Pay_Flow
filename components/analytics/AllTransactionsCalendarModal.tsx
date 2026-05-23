import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import { getPeriodRange } from '@/lib/utils/period';
import type { Period } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarMonth, formatThaiFullDate, THAI_MONTHS, type MonthData } from './CategoryCalendarModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  period: Period;
  walletId?: string | null;
  viewType?: 'expense' | 'income' | 'all';
}

export function AllTransactionsCalendarModal({ visible, onClose, period, walletId: _walletId, viewType = 'all' }: Props) {
  const allTransactions = useTransactionStore(s => s.transactions);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [expandedMonthAvg, setExpandedMonthAvg] = useState<Set<string>>(new Set());
  const [expandedAvgDays, setExpandedAvgDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) {
      setSelectedDay(null);
      setExpandedMonthAvg(new Set());
      setExpandedAvgDays(new Set());
    }
  }, [visible]);

  useEffect(() => {
    setExpandedKeys(new Set());
  }, [selectedDay]);

  const transactions = useMemo(() => {
    if (viewType === 'all') return allTransactions;
    return allTransactions.filter(t => t.type === viewType);
  }, [allTransactions, viewType]);

  const themeColor = viewType === 'expense' ? '#E87A3D' : viewType === 'income' ? '#3E8B68' : '#2B2118';
  const themeTitle = viewType === 'expense' ? 'รายจ่ายทั้งหมด' : viewType === 'income' ? 'รายรับทั้งหมด' : 'รายการทั้งหมด';
  const themeIcon: keyof typeof Ionicons.glyphMap = viewType === 'income' ? 'trending-up' : viewType === 'expense' ? 'trending-down' : 'calendar';

  const txByDate = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const existing = map.get(tx.date);
      if (existing) existing.push(tx);
      else map.set(tx.date, [tx]);
    }
    return map;
  }, [transactions]);

  const months = useMemo((): MonthData[] => {
    const { start, end } = getPeriodRange(period);
    const startDate = new Date(start);
    const endDate = new Date(end);

    const result: MonthData[] = [];
    let curYear = startDate.getFullYear();
    let curMonth = startDate.getMonth();

    while (curYear < endDate.getFullYear() || (curYear === endDate.getFullYear() && curMonth <= endDate.getMonth())) {
      const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
      const days: MonthData['days'] = [];
      let hasAmount = false;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTxs = txByDate.get(dateStr) ?? [];
        const expenseAmount = dayTxs.filter(t => t.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
        const incomeAmount = dayTxs.filter(t => t.type === 'income').reduce((s, tx) => s + tx.amount, 0);
        const amount = expenseAmount + incomeAmount;
        if (amount > 0) hasAmount = true;
        days.push({ day: d, amount, txs: dayTxs, expenseAmount, incomeAmount });
      }

      if (hasAmount) result.push({ year: curYear, month: curMonth, days });
      curMonth++;
      if (curMonth > 11) { curMonth = 0; curYear++; }
    }

    return result;
  }, [period, txByDate]);

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalBalance = totalIncome - totalExpense;
  const totalAmount = totalIncome + totalExpense;
  const selectedTxs = selectedDay ? (txByDate.get(selectedDay) ?? []) : [];
  const isSplit = viewType === 'all';

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View style={{ paddingTop: 56, paddingBottom: 8, paddingHorizontal: 16, backgroundColor: themeColor + '15' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center"
                style={{ width: 40, height: 40, backgroundColor: themeColor + '25' }}
              >
                <Ionicons name={themeIcon} size={18} color={themeColor} />
              </View>
              <View className="ml-3 flex-1">
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16 }} className="text-foreground">{themeTitle}</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">
                  {isSplit ? `${transactions.length} รายการ` : `${formatCurrency(totalAmount)} บาท · ${transactions.length} รายการ`}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-full bg-card/80">
              <Ionicons name="close" size={22} color="#A39685" />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {isSplit && (
            <View
              className="mx-4 mt-3 bg-card"
              style={{
                borderRadius: 20,
                padding: 14,
                shadowColor: '#2A2320',
                shadowOpacity: 0.05,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-muted-foreground">
                  จ่าย
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 14,
                    fontVariant: ['tabular-nums'],
                    color: '#C65A4E',
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  -{formatCurrency(totalExpense)}
                </Text>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: 'rgba(42,35,32,0.08)' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-muted-foreground">
                  รับ
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 14,
                    fontVariant: ['tabular-nums'],
                    color: '#3E8B68',
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  +{formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: 'rgba(42,35,32,0.08)' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-muted-foreground">
                  คงเหลือ
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 14,
                    fontVariant: ['tabular-nums'],
                    color: totalBalance >= 0 ? '#3E8B68' : '#C65A4E',
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {totalBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalBalance))}
                </Text>
              </View>
            </View>
          )}

          {months.map((m) => {
            const showSummary = viewType !== 'income';
            const daysInMonth = m.days.length;
            const monthExpense = m.days.reduce((s, d) => s + (d.expenseAmount ?? 0), 0);
            const monthIncome = m.days.reduce((s, d) => s + (d.incomeAmount ?? 0), 0);
            const monthBalance = monthIncome - monthExpense;
            const avgExpensePerDay = daysInMonth > 0 ? monthExpense / daysInMonth : 0;
            const avgBalancePerDay = daysInMonth > 0 ? monthBalance / daysInMonth : 0;
            const exceedingDays = m.days
              .filter(d => (d.expenseAmount ?? 0) > avgExpensePerDay && (d.expenseAmount ?? 0) > 0)
              .sort((a, b) => (b.expenseAmount ?? 0) - (a.expenseAmount ?? 0));
            const monthKey = `${m.year}-${m.month}`;
            const isMonthAvgExpanded = expandedMonthAvg.has(monthKey);

            return (
              <View key={`${m.year}-${m.month}`}>
                <CalendarMonth
                  data={m}
                  color={themeColor}
                  selectedDay={selectedDay}
                  onSelectDay={(dateStr) =>
                    setSelectedDay(selectedDay === dateStr ? null : dateStr)
                  }
                  splitMode={isSplit}
                />
                {showSummary && monthExpense > 0 && (
                  <View
                    className="mx-4 mt-3 bg-card"
                    style={{
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      shadowColor: '#2A2320',
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 2,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons name="calculator-outline" size={14} color="#A39685" />
                      <Text
                        style={{
                          fontFamily: 'IBMPlexSansThai_600SemiBold',
                          fontSize: 12,
                          marginLeft: 6,
                        }}
                        className="text-muted-foreground"
                      >
                        สรุป {THAI_MONTHS[m.month]} {m.year + 543}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Text
                        style={{
                          fontFamily: 'IBMPlexSansThai_400Regular',
                          fontSize: 10,
                          fontVariant: ['tabular-nums'],
                        }}
                        className="text-muted-foreground"
                      >
                        {daysInMonth} วัน
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        gap: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }}
                          className="text-muted-foreground"
                        >
                          รายจ่าย
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          <Text
                            style={{
                              fontFamily: 'Inter_700Bold',
                              fontSize: 15,
                              fontVariant: ['tabular-nums'],
                              color: '#C65A4E',
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            -{formatCurrency(monthExpense)}
                          </Text>
                          <Text
                            style={{
                              fontFamily: 'IBMPlexSansThai_400Regular',
                              fontSize: 11,
                              fontVariant: ['tabular-nums'],
                              marginTop: 2,
                            }}
                            className="text-muted-foreground"
                            numberOfLines={1}
                          >
                            เฉลี่ย - {formatCurrency(avgExpensePerDay)} / วัน
                          </Text>
                        </View>
                      </View>
                      {viewType === 'all' && (
                        <>
                          <View
                            style={{
                              width: 1,
                              backgroundColor: 'rgba(42,35,32,0.08)',
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: 'IBMPlexSansThai_400Regular',
                                fontSize: 11,
                              }}
                              className="text-muted-foreground"
                            >
                              คงเหลือ
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>

                              <Text
                                style={{
                                  fontFamily: 'Inter_700Bold',
                                  fontSize: 15,
                                  fontVariant: ['tabular-nums'],
                                  color: monthBalance >= 0 ? '#3E8B68' : '#C65A4E',
                                  marginTop: 2,
                                }}
                                numberOfLines={1}
                              >
                                {monthBalance >= 0 ? '+' : '-'}
                                {formatCurrency(Math.abs(monthBalance))}
                              </Text>
                              <Text
                                style={{
                                  fontFamily: 'IBMPlexSansThai_400Regular',
                                  fontSize: 11,
                                  fontVariant: ['tabular-nums'],
                                  marginTop: 2,
                                  color:
                                    avgBalancePerDay >= 0 ? '#3E8B68' : '#C65A4E',
                                  opacity: 0.85,
                                }}
                                numberOfLines={1}
                              >
                                เฉลี่ย {avgBalancePerDay >= 0 ? '+' : '-'}
                                {formatCurrency(Math.abs(avgBalancePerDay))} / วัน
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </View>

                    {exceedingDays.length > 0 && (
                      <>
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            setExpandedMonthAvg(prev => {
                              const next = new Set(prev);
                              if (next.has(monthKey)) next.delete(monthKey);
                              else next.add(monthKey);
                              return next;
                            });
                          }}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 12,
                            paddingTop: 10,
                            borderTopWidth: 0.5,
                            borderTopColor: 'rgba(42,35,32,0.08)',
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          {/* <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: '#FBE5E1',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 8,
                            }}
                          >
                            <Ionicons name="flame" size={12} color="#C65A4E" />
                          </View> */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'space-between' }}
                            className="pt-3"
                          >
                            <Text
                              style={{
                                fontFamily: 'IBMPlexSansThai_600SemiBold',
                                fontSize: 12,
                              }}
                              className="text-foreground"
                            >
                              {exceedingDays.length} วันใช้เกินค่าเฉลี่ย
                            </Text>
                            <View style={{ flex: 1 }} />
                            <Text
                              style={{
                                fontFamily: 'IBMPlexSansThai_400Regular',
                                fontSize: 10,
                                marginRight: 6,
                              }}
                              className="text-muted-foreground"
                            >
                              {isMonthAvgExpanded ? 'ดู' : 'ซ่อน'}
                            </Text>

                            <Ionicons
                              name={isMonthAvgExpanded ? 'chevron-up' : 'chevron-down'}
                              size={13}
                              color="#A39685"
                            />
                          </View>
                        </Pressable>

                        {!isMonthAvgExpanded && (
                          <View style={{ marginTop: 4 }}>
                            {exceedingDays.map((d, idx) => {
                              const dateStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                              const isDayExpanded = expandedAvgDays.has(dateStr);
                              const dayExpense = d.expenseAmount ?? 0;
                              const excess = dayExpense - avgExpensePerDay;
                              const expenseTxs = (d.txs ?? []).filter(t => t.type === 'expense');

                              return (
                                <View key={dateStr} className="pt-3">
                                  <Pressable
                                    onPress={() => {
                                      Haptics.selectionAsync();
                                      setExpandedAvgDays(prev => {
                                        const next = new Set(prev);
                                        if (next.has(dateStr)) next.delete(dateStr);
                                        else next.add(dateStr);
                                        return next;
                                      });
                                    }}
                                    style={({ pressed }) => ({
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      paddingVertical: 8,
                                      borderTopWidth: idx > 0 ? 0.5 : 0,
                                      borderTopColor: 'rgba(42,35,32,0.05)',
                                      opacity: pressed ? 0.7 : 1,
                                    })}
                                  >

                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={{
                                          fontFamily: 'IBMPlexSansThai_600SemiBold',
                                          fontSize: 12,
                                        }}
                                        className="text-foreground"
                                        numberOfLines={1}
                                      >
                                        {formatThaiFullDate(dateStr)}
                                      </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                                      <Text
                                        style={{
                                          fontFamily: 'IBMPlexSansThai_600SemiBold',
                                          fontSize: 12,
                                          fontVariant: ['tabular-nums'],
                                          marginRight: 6,
                                        }}
                                      >
                                        ใช้ -{formatCurrency(dayExpense)}
                                      </Text>
                                      <Text
                                        style={{
                                          fontFamily: 'IBMPlexSansThai_400Regular',
                                          fontSize: 10,
                                          fontVariant: ['tabular-nums'],
                                          color: '#C65A4E',
                                          marginTop: 1,
                                        }}
                                        className="text-muted-foreground"
                                        numberOfLines={1}
                                      >
                                        เกินเฉลี่ย +{formatCurrency(excess)} · {expenseTxs.length} รายการ

                                      </Text>
                                      <Ionicons
                                        name={isDayExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={12}
                                        color="#A39685"
                                      />
                                    </View>
                                  </Pressable>

                                  {isDayExpanded && expenseTxs.length > 0 && (
                                    <View
                                      style={{
                                        marginLeft: 32,
                                        marginBottom: 6,
                                        paddingTop: 2,
                                      }}
                                    >
                                      {expenseTxs
                                        .sort((a, b) => b.amount - a.amount)
                                        .map(tx => {
                                          const catColor = tx.category?.color ?? '#D3CBC3';
                                          const catName = tx.category?.name ?? 'อื่น ๆ';
                                          const primary = tx.note || tx.wallet?.name || catName;
                                          const overItem = tx.amount > avgExpensePerDay;
                                          return (
                                            <View
                                              key={tx.id}
                                              style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 5,
                                                gap: 8,
                                              }}
                                            >
                                              <View
                                                style={{
                                                  width: 6,
                                                  height: 6,
                                                  borderRadius: 3,
                                                  backgroundColor: catColor,
                                                }}
                                              />
                                              <View style={{ flex: 1 }}>
                                                <Text
                                                  style={{
                                                    fontFamily: 'IBMPlexSansThai_400Regular',
                                                    fontSize: 11,
                                                  }}
                                                  className="text-foreground"
                                                  numberOfLines={1}
                                                >
                                                  {catName} · {primary}
                                                </Text>
                                              </View>
                                              {overItem && (
                                                <Ionicons name="warning" size={10} color="#C65A4E" />
                                              )}
                                              <Text
                                                style={{
                                                  fontFamily: 'Inter_600SemiBold',
                                                  fontSize: 11,
                                                  fontVariant: ['tabular-nums'],
                                                  color: '#C65A4E',
                                                }}
                                              >
                                                -{formatCurrency(tx.amount)}
                                              </Text>
                                            </View>
                                          );
                                        })}
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {selectedDay && selectedTxs.length > 0 && (
            <View className="mx-4 mt-2 bg-card" style={{ borderRadius: 20, overflow: 'hidden', shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
              <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground">
                  {formatThaiFullDate(selectedDay)}
                </Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, marginTop: 1 }} className="text-muted-foreground">
                  รวม: {formatCurrency(selectedTxs.reduce((s, tx) => s + tx.amount, 0))}
                </Text>
              </View>
              {(() => {
                type GroupItem = {
                  key: string;
                  category: typeof selectedTxs[number]['category'];
                  type: typeof selectedTxs[number]['type'];
                  total: number;
                  txs: typeof selectedTxs;
                };
                const groupMap = new Map<string, GroupItem>();
                for (const tx of selectedTxs) {
                  const key = `${tx.categoryId}__${tx.type}`;
                  const existing = groupMap.get(key);
                  if (existing) {
                    existing.total += tx.amount;
                    existing.txs.push(tx);
                  } else {
                    groupMap.set(key, {
                      key,
                      category: tx.category,
                      type: tx.type,
                      total: tx.amount,
                      txs: [tx],
                    });
                  }
                }
                const groups = Array.from(groupMap.values());

                return groups.map((group, i) => {
                  const catColor = group.category?.color ?? '#D3CBC3';
                  const catIcon = (group.category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap;
                  const catName = group.category?.name ?? 'อื่น ๆ';
                  const isExpanded = expandedKeys.has(group.key);
                  const sign = group.type === 'income' ? '+' : '-';
                  const isIncome = group.type === 'income';

                  return (
                    <View
                      key={group.key}
                      style={{
                        borderTopWidth: i > 0 ? 0.5 : 0,
                        borderTopColor: 'rgba(42,35,32,0.06)',
                      }}
                    >
                      {/* Group header */}
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setExpandedKeys(prev => {
                            const next = new Set(prev);
                            if (next.has(group.key)) next.delete(group.key);
                            else next.add(group.key);
                            return next;
                          });
                        }}
                        style={({ pressed }) => ({
                          flexDirection: 'row', alignItems: 'center',
                          paddingVertical: 12, paddingHorizontal: 16,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <View className="px-4 py-2 flex-row items-center">
                          <View style={{ marginRight: 12 }}>
                            <CatCategoryIcon
                              kind={catIcon}
                              size={36}
                              bg={catColor + '20'}
                              strokeColor={catColor}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {isSplit && (
                                <View
                                  style={{
                                    paddingHorizontal: 6,
                                    paddingVertical: 1,
                                    borderRadius: 6,
                                    backgroundColor: isIncome ? '#E3F1EA' : '#FBE5E1',
                                    borderWidth: 1,
                                    borderColor: isIncome ? '#3E8B68' : '#C65A4E',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontFamily: 'IBMPlexSansThai_700Bold',
                                      fontSize: 10,
                                      lineHeight: 14,
                                      color: isIncome ? '#3E8B68' : '#C65A4E',
                                    }}
                                  >
                                    {isIncome ? 'รับ' : 'จ่าย'}
                                  </Text>
                                </View>
                              )}
                              <Text
                                style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, flexShrink: 1 }}
                                className="text-foreground"
                                numberOfLines={1}
                              >
                                {catName}
                              </Text>
                            </View>
                            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 1 }} className="text-muted-foreground">
                              {group.txs.length} รายการ
                            </Text>
                          </View>
                          <Text
                            className={isIncome ? '' : 'text-foreground'}
                            style={{
                              fontFamily: 'Inter_700Bold', fontSize: 14, fontVariant: ['tabular-nums'],
                              color: isIncome ? '#3E8B68' : '#C65A4E',
                              marginRight: 8,
                            }}
                          >
                            {sign}{formatCurrency(group.total)}
                          </Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color="#A39685"
                          />
                        </View>

                      </Pressable>

                      {/* Child transactions */}
                      {isExpanded && group.txs.map((tx) => {
                        const primary = tx.note || tx.wallet?.name || 'รายการ';
                        const secondary = tx.note && tx.wallet ? tx.wallet.name : null;
                        return (
                          <View
                            key={tx.id}
                            style={{
                              flexDirection: 'row', alignItems: 'center',
                              paddingVertical: 8, paddingLeft: 64, paddingRight: 16,
                              borderTopWidth: 0.5,
                              borderTopColor: 'rgba(42,35,32,0.04)',
                              backgroundColor: 'rgba(42,35,32,0.02)',
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-foreground" numberOfLines={1}>
                                {primary}
                              </Text>
                              {secondary && (
                                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 1 }} className="text-muted-foreground" numberOfLines={1}>
                                  {secondary}
                                </Text>
                              )}
                            </View>
                            <Text
                              className={isIncome ? '' : 'text-foreground'}
                              style={{
                                fontFamily: 'Inter_600SemiBold', fontSize: 13, fontVariant: ['tabular-nums'],
                                color: isIncome ? '#3E8B68' : '#C65A4E',
                              }}
                            >
                              {sign}{formatCurrency(tx.amount)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                });
              })()}
            </View>
          )}

          {months.length === 0 && (
            <View className="items-center py-20">
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground">ไม่มีข้อมูล</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
