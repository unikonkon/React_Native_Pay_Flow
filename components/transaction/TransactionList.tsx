import { EmptyState } from '@/components/ui/EmptyState';
import type { Transaction } from '@/types';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { DayGroupHeader } from './DayGroupHeader';
import { TransactionGroupItem } from './TransactionGroupItem';

interface TransactionListProps {
  transactions: Transaction[];
  onItemPress?: (item: Transaction) => void;
  onItemLongPress?: (item: Transaction) => void;
  onDeleteItem?: (item: Transaction) => void;
  onDeleteGroup?: (items: Transaction[]) => void;
  onCopyItem?: (item: Transaction) => void;
}

interface DaySection {
  date: string;
  income: number;
  expense: number;
  groups: Transaction[][];
}

export function TransactionList({
  transactions,
  onItemPress,
  onItemLongPress,
  onDeleteItem,
  onDeleteGroup,
  onCopyItem,
}: TransactionListProps) {
  const days: DaySection[] = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const day = tx.date;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(tx);
    }

    return Array.from(byDay.entries()).map(([date, txs]) => {
      const groups = new Map<string, Transaction[]>();
      for (const t of txs) {
        const key = `${t.type}:${t.categoryId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
      }
      return {
        date,
        income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        groups: Array.from(groups.values()),
      };
    });
  }, [transactions]);

  if (transactions.length === 0) {
    return <EmptyState title="ยังไม่มีรายการ" subtitle="กดปุ่ม + เพื่อเพิ่มรายการ" />;
  }

  return (
    <ScrollView
      // Trailing inset so the final rows clear the floating FAB mascot
      // (~110px tall, anchored bottom-right). The bottom tab bar already
      // sits below the screen's SafeAreaView — this padding only handles
      // the FAB overlap.
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {days.map((day) => (
        <View key={day.date} style={{ marginHorizontal: 12, marginTop: 14 }} className="">
          <DayGroupHeader date={day.date} income={day.income} expense={day.expense} />
          <View
            className="bg-card"
            style={{
              marginTop: -18,
              borderRadius: 22,
              overflow: 'hidden',
              shadowColor: '#2A2320',
              shadowOpacity: 0.05,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
     
            {day.groups.map((g, i) => (
              <TransactionGroupItem
                key={g[0]?.id ?? `${day.date}-${i}`}
                items={g}
                isLastInDay={i === day.groups.length - 1}
                onItemPress={onItemPress}
                onItemLongPress={onItemLongPress}
                onDeleteItem={onDeleteItem}
                onDeleteGroup={onDeleteGroup}
                onCopyItem={onCopyItem}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
