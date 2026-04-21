import { getDb, getTransactionsByCategoryAndRange } from '@/lib/stores/db';
import { formatCurrency } from '@/lib/utils/format';
import { getPeriodRange } from '@/lib/utils/period';
import type { Category, Period, Transaction, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export interface MonthData {
  year: number;
  month: number; // 0-based
  days: { day: number; amount: number; txs: Transaction[] }[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  category: Category;
  period: Period;
  walletId?: string | null;
  viewType?: 'expense' | 'income' | 'all';
}

export function CategoryCalendarModal({ visible, onClose, category, period, walletId, viewType }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDb();
      const { start, end } = getPeriodRange(period);
      const txType: TransactionType | null = viewType === 'all' ? null : (viewType as TransactionType) ?? null;
      const txs = await getTransactionsByCategoryAndRange(db, category.id, start, end, walletId, txType);
      setTransactions(txs);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [category.id, period, walletId, viewType]);

  useEffect(() => {
    if (visible) {
      setSelectedDay(null);
      // Defer DB fetch to next frame so the modal paints instantly
      requestAnimationFrame(() => loadData());
    }
  }, [visible, loadData]);

  // Group transactions by date
  const txByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const existing = map.get(tx.date);
      if (existing) existing.push(tx);
      else map.set(tx.date, [tx]);
    }
    return map;
  }, [transactions]);

  // Build month data
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

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTxs = txByDate.get(dateStr) ?? [];
        const amount = dayTxs.reduce((sum, tx) => sum + tx.amount, 0);
        days.push({ day: d, amount, txs: dayTxs });
      }

      result.push({ year: curYear, month: curMonth, days });
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
        <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: category.color + '15' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center"
                style={{ width: 40, height: 40, backgroundColor: category.color + '25' }}
              >
                <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={18} color={category.color} />
              </View>
              <View className="ml-3 flex-1">
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">{category.name}</Text>
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

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={category.color} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Calendar months */}
            {months.map((m) => (
              <CalendarMonth
                key={`${m.year}-${m.month}`}
                data={m}
                color={category.color}
                selectedDay={selectedDay}
                onSelectDay={(dateStr) => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
              />
            ))}

            {/* Selected day transactions */}
            {selectedDay && selectedTxs.length > 0 && (
              <View className="mx-4 mt-2 bg-card" style={{ borderRadius: 20, overflow: 'hidden', shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground">
                    {formatThaiFullDate(selectedDay)}
                  </Text>
                </View>
                {selectedTxs.map((tx, i) => (
                  <View
                    key={tx.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingVertical: 12, paddingHorizontal: 16,
                      borderTopWidth: i > 0 ? 0.5 : 0,
                      borderTopColor: 'rgba(42,35,32,0.06)',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-foreground" numberOfLines={1}>
                        {tx.note || category.name}
                      </Text>
                      {tx.wallet && (
                        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 1 }} className="text-muted-foreground">
                          {tx.wallet.name}
                        </Text>
                      )}
                    </View>
                    <Text style={{
                      fontFamily: 'Inter_700Bold', fontSize: 14, fontVariant: ['tabular-nums'],
                      color: tx.type === 'income' ? '#3E8B68' : '#2B2118',
                    }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ===== Calendar Month Component =====

export const CalendarMonth = React.memo(function CalendarMonth({ data, color, selectedDay, onSelectDay }: {
  data: MonthData;
  color: string;
  selectedDay: string | null;
  onSelectDay: (dateStr: string) => void;
}) {
  const firstDayOfWeek = new Date(data.year, data.month, 1).getDay(); // 0=Sun
  const buddhistYear = data.year + 543;

  // Build grid: empty cells + day cells
  const cells: (null | MonthData['days'][number])[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (const d of data.days) cells.push(d);

  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  const hasAnyAmount = data.days.some(d => d.amount > 0);
  if (!hasAnyAmount && data.days.length > 0) {
    // Show month header but collapsed
    return (
      <View className="mx-4 mt-4">
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-muted-foreground">
          {THAI_MONTHS[data.month]} {buddhistYear}
        </Text>
      </View>
    );
  }

  return (
    <View className="mx-4 mt-4">
      {/* Month title */}
      <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, marginBottom: 8 }} className="text-foreground">
        {THAI_MONTHS[data.month]} {buddhistYear}
      </Text>

      {/* Day of week headers */}
      <View className="flex-row mb-1">
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: i === 0 ? '#E87A3D' : '#A39685' }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <View key={week} className="flex-row">
          {cells.slice(week * 7, week * 7 + 7).map((cell, ci) => {
            if (!cell) {
              return <View key={ci} style={{ flex: 1, aspectRatio: 1 }} />;
            }
            const dateStr = `${data.year}-${String(data.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
            const isSelected = selectedDay === dateStr;
            const hasAmount = cell.amount > 0;

            return (
              <Pressable
                key={ci}
                onPress={() => hasAmount ? onSelectDay(dateStr) : undefined}
                style={{
                  flex: 1, aspectRatio: 1,
                  alignItems: 'center', justifyContent: 'center',
                  margin: 1.5, borderRadius: 12,
                  backgroundColor: isSelected ? color : hasAmount ? color + '12' : 'transparent',
                }}
              >
                <Text style={{
                  fontFamily: 'Inter_600SemiBold', fontSize: 13,
                  color: isSelected ? '#fff' : hasAmount ? '#2B2118' : '#C5B9AB',
                }}>
                  {cell.day}
                </Text>
                {hasAmount && (
                  <Text
                    style={{
                      fontFamily: 'Inter_700Bold', // หนาขึ้น
                      fontSize: 10,
                      paddingTop: 4,
                      color: isSelected 
                        ? '#fff' // เมื่อเลือกให้ขาวสนิทเพื่อความชัด
                        : color, // ใช้สีหลักของหมวดหมู่
                      marginTop: -1,
                      textShadowColor: isSelected ? 'rgba(0,0,0,0.15)' : undefined,
                      textShadowOffset: isSelected ? { width: 0, height: 1 } : undefined,
                      textShadowRadius: isSelected ? 2 : undefined,
                    }}
                    numberOfLines={1}
                  >
                    {formatCompact(cell.amount)}
                  </Text>
                )}
           
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});

// ===== Helpers =====

export function formatCompact(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
  return formatCurrency(amount);
}

export function formatThaiFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  const year = d.getFullYear() + 543;
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return `วัน${dayNames[d.getDay()]}ที่ ${day} ${month} ${year}`;
}
