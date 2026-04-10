import { View, Text } from 'react-native';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';

interface DayGroupHeaderProps {
  date: string;
  income: number;
  expense: number;
}

export function DayGroupHeader({ date, income, expense }: DayGroupHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 bg-background">
      <Text className="text-muted-foreground text-sm font-semibold">
        {formatRelativeDate(date)}
      </Text>
      <View className="flex-row gap-3">
        {income > 0 && (
          <Text className="text-income text-xs font-medium">+{formatCurrency(income)}</Text>
        )}
        {expense > 0 && (
          <Text className="text-expense text-xs font-medium">-{formatCurrency(expense)}</Text>
        )}
      </View>
    </View>
  );
}
