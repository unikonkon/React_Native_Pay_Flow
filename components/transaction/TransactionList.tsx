import { FlashList } from '@shopify/flash-list';
import type { Transaction } from '@/types';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from '@/components/ui/EmptyState';

interface TransactionListProps {
  transactions: Transaction[];
  onItemPress?: (item: Transaction) => void;
  onItemLongPress?: (item: Transaction) => void;
}

export function TransactionList({ transactions, onItemPress, onItemLongPress }: TransactionListProps) {
  if (transactions.length === 0) {
    return <EmptyState title="ยังไม่มีรายการ" subtitle="กดปุ่ม + เพื่อเพิ่มรายการ" />;
  }

  return (
    <FlashList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TransactionItem
          item={item}
          onPress={onItemPress}
          onLongPress={onItemLongPress}
        />
      )}
/>
  );
}
