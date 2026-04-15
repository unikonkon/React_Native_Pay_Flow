import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

interface TransactionItemProps {
  item: Transaction;
  onPress?: (item: Transaction) => void;
  onLongPress?: (item: Transaction) => void;
}

export function TransactionItem({ item, onPress, onLongPress }: TransactionItemProps) {
  const isIncome = item.type === 'income';
  const icon = item.category?.icon ?? 'help-circle';
  const color = item.category?.color ?? '#999';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(item);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.(item);
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      className="flex-row items-center py-3 px-4 bg-card border-b border-border"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: color }}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="white" />
      </View>

      <View className="flex-1">
        <Text className="text-foreground font-medium text-base">
          {item.category?.name ?? 'ไม่ระบุ'}
        </Text>
        {item.note ? (
          <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
      </View>

      <View className="items-end">
        <Text className={`font-bold text-base ${isIncome ? 'text-income' : 'text-expense'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        <Text className="text-muted-foreground text-xs">{formatTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}
