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
    <View
      className="self-start flex-row items-center bg-accent"
      style={{
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderBottomRightRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 5,
        paddingBottom: 18,
        gap: 8,
        shadowColor: '#2A2320',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <Text
        style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, fontVariant: ['tabular-nums'] }}
        className="text-foreground"
      >
        {formatRelativeDate(date)}
      </Text>
      {income > 0 && (
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#3E8B68' }}>
          +{formatCurrency(income)}
        </Text>
      )}
      {expense > 0 && (
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#C65A4E' }}>
          −{formatCurrency(expense)}
        </Text>
      )}
      {hasAny && (
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 15,
            color: balanceColor,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: 5,
            backgroundColor: balanceColor + '15',
          }}
        >
          = {balanceSign}{formatCurrency(Math.abs(balance))}
        </Text>
      )}
    </View>
  );
}
