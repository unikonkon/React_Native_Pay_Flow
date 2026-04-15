import { SectionList } from 'react-native';
import { useMemo } from 'react';
import type { Transaction } from '@/types';
import { TransactionGroupItem } from './TransactionGroupItem';
import { DayGroupHeader } from './DayGroupHeader';
import { EmptyState } from '@/components/ui/EmptyState';

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
  data: Transaction[][];
}

export function TransactionList({
  transactions,
  onItemPress,
  onItemLongPress,
  onDeleteItem,
  onDeleteGroup,
  onCopyItem,
}: TransactionListProps) {
  const sections: DaySection[] = useMemo(() => {
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
        data: Array.from(groups.values()),
      };
    });
  }, [transactions]);

  if (transactions.length === 0) {
    return <EmptyState title="ยังไม่มีรายการ" subtitle="กดปุ่ม + เพื่อเพิ่มรายการ" />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(group) => group[0]?.id ?? Math.random().toString()}
      renderItem={(info: any) => (
        <TransactionGroupItem
          items={info.item as Transaction[]}
          onItemPress={onItemPress}
          onItemLongPress={onItemLongPress}
          onDeleteItem={onDeleteItem}
          onDeleteGroup={onDeleteGroup}
          onCopyItem={onCopyItem}
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
