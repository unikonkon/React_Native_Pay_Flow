import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';
import { Text, View } from 'react-native';

interface DayGroupHeaderProps {
  date: string;
  income: number;
  expense: number;
}

export function DayGroupHeader({ date, income, expense }: DayGroupHeaderProps) {
  return (
    <View className="flex-row items-center" style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(42,35,32,0.08)', marginTop: 8, gap: 10 }}>
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, fontVariant: ['tabular-nums'] }} className="text-foreground">
        {formatRelativeDate(date)}
      </Text>
      <View style={{ flex: 1 }} />
      {income > 0 && (
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, fontVariant: ['tabular-nums'], color: '#3E8B68' }}>+{formatCurrency(income)}</Text>
      )}
      {expense > 0 && (
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, fontVariant: ['tabular-nums'], color: '#C65A4E' }}>−{formatCurrency(expense)}</Text>
      )}
    </View>
  );
}
