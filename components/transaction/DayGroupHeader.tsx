import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';
import { Text, View } from 'react-native';

interface DayGroupHeaderProps {
  date: string;
  income: number;
  expense: number;
}

export function DayGroupHeader({ date, income, expense }: DayGroupHeaderProps) {
  const balance = income - expense;
  const balanceSign = balance > 0 ? '+' : balance < 0 ? '−' : '=';
  const balanceColor = balance > 0 ? '#3E8B68' : balance < 0 ? '#C65A4E' : '#6B5F52';
  const hasAny = income > 0 && expense > 0;

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
      {hasAny && (
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 14,
            fontVariant: ['tabular-nums'],
            color: balanceColor,
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 6,
            backgroundColor: balanceColor + '15',
          }}
        >
         = {balanceSign}{formatCurrency(Math.abs(balance))}
        </Text>
      )}
    </View>
  );
}
