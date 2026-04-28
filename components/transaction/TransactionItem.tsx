import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { type PawPrintTapEffectHandle } from '@/components/ui/PawPrintTapEffect';
import { formatCurrency } from '@/lib/utils/format';
import type { Transaction } from '@/types';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

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
  const pawRef = useRef<PawPrintTapEffectHandle>(null);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        pawRef.current?.play();
        onPress?.(item);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.(item);
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      className="flex-row items-center py-3 px-4 bg-card border-b border-border"
    >
      <View className="mr-3">
        <CatCategoryIcon kind={icon} size={40} bg={color} />
      </View>

      <View className="flex-1">
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 17 }} className="text-foreground">
          {item.category?.name ?? 'ไม่ระบุ'}
        </Text>
        {item.note ? (
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground mt-0.5" numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
      </View>

      <View className="items-end">
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, fontVariant: ['tabular-nums'], letterSpacing: -0.2 }} className={isIncome ? 'text-income' : 'text-expense'}>
          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">{formatTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}
