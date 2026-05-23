import { EmptyState } from '@/components/ui/EmptyState';
import type { Transaction } from '@/types';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { DayGroupHeader } from './DayGroupHeader';
import { TransactionGroupItem } from './TransactionGroupItem';

interface TransactionListProps {
  transactions: Transaction[];
  onItemPress?: (item: Transaction) => void;
  onItemLongPress?: (item: Transaction) => void;
  onDeleteItem?: (item: Transaction) => void;
  onDeleteGroup?: (items: Transaction[]) => void;
  onCopyItem?: (item: Transaction) => void;
  ListHeaderComponent?: React.ReactElement | null;
  contentContainerStyle?: object;
}

interface DaySection {
  date: string;
  income: number;
  expense: number;
  groups: Transaction[][];
}

interface DayCardProps {
  day: DaySection;
  onItemPress?: (item: Transaction) => void;
  onItemLongPress?: (item: Transaction) => void;
  onDeleteItem?: (item: Transaction) => void;
  onDeleteGroup?: (items: Transaction[]) => void;
  onCopyItem?: (item: Transaction) => void;
}

const DayCard = memo(function DayCard({
  day,
  onItemPress,
  onItemLongPress,
  onDeleteItem,
  onDeleteGroup,
  onCopyItem,
}: DayCardProps) {
  return (
    <View style={{ marginHorizontal: 12, marginTop: 14 }}>
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
  );
});

export function TransactionList({
  transactions,
  onItemPress,
  onItemLongPress,
  onDeleteItem,
  onDeleteGroup,
  onCopyItem,
  ListHeaderComponent,
  contentContainerStyle,
}: TransactionListProps) {
  const days: DaySection[] = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const day = tx.date;
      const existing = byDay.get(day);
      if (existing) existing.push(tx);
      else byDay.set(day, [tx]);
    }

    const result: DaySection[] = [];
    for (const [date, txs] of byDay) {
      const groupMap = new Map<string, Transaction[]>();
      let income = 0;
      let expense = 0;
      for (const t of txs) {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expense += t.amount;
        const key = `${t.type}:${t.categoryId}`;
        const g = groupMap.get(key);
        if (g) g.push(t);
        else groupMap.set(key, [t]);
      }
      result.push({ date, income, expense, groups: Array.from(groupMap.values()) });
    }
    return result;
  }, [transactions]);

  const renderItem = useCallback(
    ({ item }: { item: DaySection }) => (
      <DayCard
        day={item}
        onItemPress={onItemPress}
        onItemLongPress={onItemLongPress}
        onDeleteItem={onDeleteItem}
        onDeleteGroup={onDeleteGroup}
        onCopyItem={onCopyItem}
      />
    ),
    [onItemPress, onItemLongPress, onDeleteItem, onDeleteGroup, onCopyItem],
  );

  const FlatListAny = FlatList as unknown as React.ComponentType<Record<string, unknown>>;

  return (
    <FlatListAny
      data={days}
      renderItem={renderItem}
      keyExtractor={(item: DaySection) => item.date}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <EmptyState title="ยังไม่มีรายการ" subtitle="กดปุ่ม + เพื่อเพิ่มรายการ" />
      }
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      maxToRenderPerBatch={6}
      windowSize={9}
      removeClippedSubviews
    />
  );
}
