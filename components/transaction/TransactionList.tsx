import { SectionList } from 'react-native';
import { useMemo } from 'react';
import type { Transaction } from '@/types';
import { TransactionItem } from './TransactionItem';
import { DayGroupHeader } from './DayGroupHeader';
import { EmptyState } from '@/components/ui/EmptyState';

interface TransactionListProps {
  transactions: Transaction[];
  onItemPress?: (item: Transaction) => void;
  onItemLongPress?: (item: Transaction) => void;
}

interface DaySection {
  date: string;
  income: number;
  expense: number;
  data: Transaction[];
}

export function TransactionList({ transactions, onItemPress, onItemLongPress }: TransactionListProps) {
  const sections: DaySection[] = useMemo(() => {
    const map = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      const day = tx.date;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(tx);
    }

    return Array.from(map.entries()).map(([date, txs]) => ({
      date,
      income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      data: txs,
    }));
  }, [transactions]);

  if (transactions.length === 0) {
    return <EmptyState title="ยังไม่มีรายการ" subtitle="กดปุ่ม + เพื่อเพิ่มรายการ" />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(tx) => tx.id}
      renderItem={(info: any) => (
        <TransactionItem
          item={info.item}
          onPress={onItemPress}
          onLongPress={onItemLongPress}
        />
      )}
      renderSectionHeader={({ section }: any) => (
        <DayGroupHeader
          date={section.date}
          income={section.income}
          expense={section.expense}
        />
      )}
      stickySectionHeadersEnabled={false}
    />
  );
}
