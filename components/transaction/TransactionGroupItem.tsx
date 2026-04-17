import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { SwipeableRow } from './SwipeableRow';

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

interface TransactionGroupItemProps {
  items: Transaction[];
  onItemPress?: (item: Transaction) => void;
  onItemLongPress?: (item: Transaction) => void;
  onDeleteItem?: (item: Transaction) => void;
  onDeleteGroup?: (items: Transaction[]) => void;
  onCopyItem?: (item: Transaction) => void;
}

export function TransactionGroupItem({
  items,
  onItemPress,
  onItemLongPress,
  onDeleteItem,
  onDeleteGroup,
  onCopyItem,
}: TransactionGroupItemProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;
  const head = items[0];
  const isIncome = head.type === 'income';
  const icon = head.category?.icon ?? 'help-circle';
  const color = head.category?.color ?? '#999';
  const total = items.reduce((s, t) => s + t.amount, 0);
  const count = items.length;
  const isGroup = count > 1;

  const handleHeadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isGroup) {
      setExpanded(e => !e);
    } else {
      onItemPress?.(head);
    }
  };

  const handleHeadLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onItemLongPress?.(head);
  };

  const headContent = (
    <Pressable
      onPress={handleHeadPress}
      onLongPress={handleHeadLongPress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      className="flex-row items-center py-3 px-4 bg-card"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: color }}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="white" />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-foreground font-medium text-base" numberOfLines={1}>
            {head.category?.name ?? 'ไม่ระบุ'}
          </Text>
          {isGroup && (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-primary/10">
              <Text className="text-primary text-[11px] font-bold">×{count}</Text>
            </View>
          )}
        </View>
        {!isGroup && head.note ? (
          <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
            {head.note}
          </Text>
        ) : null}
      </View>

      <View className="items-end">
        <Text className={`font-bold text-base ${isIncome ? 'text-income' : 'text-expense'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(total)}
        </Text>
        <View className="flex-row items-center">
          {!isGroup && (
            <Text className="text-muted-foreground text-xs">{formatTime(head.createdAt)}</Text>
          )}
          {isGroup && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#A39685"
              style={{ marginLeft: 2 }}
            />
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="border-b border-border">
      <SwipeableRow
        onDelete={() => {
          if (isGroup) {
            onDeleteGroup?.(items);
          } else {
            onDeleteItem?.(head);
          }
        }}
        onCopy={() => onCopyItem?.(head)}
      >
        {headContent}
      </SwipeableRow>

      {isGroup && expanded && (
        <View className="bg-background/40 border-t border-border">
          {items.map((t) => (
            <SwipeableRow
              key={t.id}
              onDelete={() => onDeleteItem?.(t)}
              onCopy={() => onCopyItem?.(t)}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onItemPress?.(t);
                }}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onItemLongPress?.(t);
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                className="flex-row items-center py-2 pl-[60px] pr-4 border-b border-border/60 bg-card"
              >
                <View className="flex-1">
                  <Text className="text-muted-foreground text-xs">{formatTime(t.createdAt)}</Text>
                  {t.note ? (
                    <Text className="text-muted-foreground text-[11px] mt-0.5" numberOfLines={1}>
                      {t.note}
                    </Text>
                  ) : null}
                </View>
                <Text className={`font-semibold text-sm ${isIncome ? 'text-income' : 'text-expense'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                </Text>
              </Pressable>
            </SwipeableRow>
          ))}
        </View>
      )}
    </View>
  );
}
