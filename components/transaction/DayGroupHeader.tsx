import { View, Text } from 'react-native';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';

interface DayGroupHeaderProps {
  date: string;
  income: number;
  expense: number;
}

export function DayGroupHeader({ date, income, expense }: DayGroupHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 bg-secondary" style={{ height: 36 }}>
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }} className="text-muted-foreground">
        {formatRelativeDate(date)}
      </Text>
      <View className="flex-row" style={{ gap: 12 }}>
        {income > 0 && (
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, fontVariant: ['tabular-nums'] }} className="text-income">+{formatCurrency(income)}</Text>
        )}
        {expense > 0 && (
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, fontVariant: ['tabular-nums'] }} className="text-expense">-{formatCurrency(expense)}</Text>
        )}
      </View>
    </View>
  );
}
