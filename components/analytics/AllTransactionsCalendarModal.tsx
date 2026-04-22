import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import { getPeriodRange } from '@/lib/utils/period';
import type { Period } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarMonth, formatThaiFullDate, type MonthData } from './CategoryCalendarModal';

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

  useEffect(() => {
    if (!visible) setSelectedDay(null);
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
        const amount = dayTxs.reduce((sum, tx) => sum + tx.amount, 0);
        if (amount > 0) hasAmount = true;
        days.push({ day: d, amount, txs: dayTxs });
      }

      if (hasAmount) result.push({ year: curYear, month: curMonth, days });
      curMonth++;
      if (curMonth > 11) { curMonth = 0; curYear++; }
    }

    return result;
  }, [period, txByDate]);

  const totalAmount = transactions.reduce((s, tx) => s + tx.amount, 0);
  const selectedTxs = selectedDay ? (txByDate.get(selectedDay) ?? []) : [];

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: themeColor + '15' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center"
                style={{ width: 40, height: 40, backgroundColor: themeColor + '25' }}
              >
                <Ionicons name={themeIcon} size={18} color={themeColor} />
              </View>
              <View className="ml-3 flex-1">
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">{themeTitle}</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">
                  {formatCurrency(totalAmount)} บาท · {transactions.length} รายการ
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-full bg-white/80">
              <Ionicons name="close" size={22} color="#6B5F52" />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {months.map((m) => (
            <CalendarMonth
              key={`${m.year}-${m.month}`}
              data={m}
              color={themeColor}
              selectedDay={selectedDay}
              onSelectDay={(dateStr) => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
            />
          ))}

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
                  const amountColor = group.type === 'income' ? '#3E8B68' : '#2B2118';

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
                          <View
                            className="rounded-full items-center justify-center"
                            style={{ width: 36, height: 36, backgroundColor: catColor + '20', marginRight: 12 }}
                          >
                            <Ionicons name={catIcon} size={16} color={catColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground" numberOfLines={1}>
                              {catName}
                            </Text>
                            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 1 }} className="text-muted-foreground">
                              {group.txs.length} รายการ
                            </Text>
                          </View>
                          <Text style={{
                            fontFamily: 'Inter_700Bold', fontSize: 14, fontVariant: ['tabular-nums'],
                            color: amountColor,
                            marginRight: 8,
                          }}>
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
                            <Text style={{
                              fontFamily: 'Inter_600SemiBold', fontSize: 13, fontVariant: ['tabular-nums'],
                              color: amountColor,
                            }}>
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
