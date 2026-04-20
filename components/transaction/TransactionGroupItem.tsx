import { formatCurrency } from '@/lib/utils/format';
import type { Transaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
      className="flex-row items-center bg-card"
      style={{
        paddingVertical: 10, paddingHorizontal: 12, gap: 11,
        borderRadius: 16,
        shadowColor: '#2A2320', shadowOpacity: 0.04, shadowRadius: 13, shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View
        className="rounded-full items-center justify-center"
        style={{ width: 38, height: 38, backgroundColor: color }}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color="white" />
      </View>

      <View className="flex-1" style={{ minWidth: 0 }}>
        <View className="flex-row items-center" style={{ gap: 7 }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground" numberOfLines={1}>
            {head.category?.name ?? 'ไม่ระบุ'}
          </Text>
          {isGroup && (
            <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999, backgroundColor: '#F0D0CB' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, fontVariant: ['tabular-nums'], color: '#C65A4E' }}>×{count}</Text>
            </View>
          )}
        </View>
        {!isGroup && head.note ? (
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground" numberOfLines={1}>
            {head.note}
          </Text>
        ) : null}
      </View>

      <View className="items-end">
        <Text style={{ fontFamily: 'Inter_700SemiBold', fontSize: 15, fontVariant: ['tabular-nums'], letterSpacing: -0.2 }} className={isIncome ? 'text-income' : 'text-expense'}>
          {isIncome ? '+' : '-'}{formatCurrency(total)}
        </Text>
        <View className="flex-row items-center">
          {!isGroup && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">{formatTime(head.createdAt)}</Text>
          )}
          {isGroup && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#A39685"
            />
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={{ marginHorizontal: 12, marginVertical: 2 }}>
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
        <View className="">
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
                className="flex-row items-center border-b border-border/60 bg-card rounded-xl"
                style={{ paddingVertical: 7, paddingLeft: 60, paddingRight: 14, gap: 7, borderColor: 'rgba(42,35,32,0.28)' }}
              >
                <View style={{ width: 8, height: 1 }} className="bg-border" />
                <View className="flex-1">
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-foreground" numberOfLines={1}>
                    {t.note || formatTime(t.createdAt)}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Inter_700SemiBold', fontSize: 13, fontVariant: ['tabular-nums'] }} className={isIncome ? 'text-income' : 'text-expense'}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'], width: 40, textAlign: 'right' }} className="text-muted-foreground">{formatTime(t.createdAt)}</Text>
              </Pressable>
            </SwipeableRow>
          ))}
        </View>
      )}
    </View>
  );
}
