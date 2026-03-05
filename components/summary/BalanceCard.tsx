import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/currency';

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function BalanceCard({ totalIncome, totalExpense, balance }: BalanceCardProps) {
  return (
    <View className="bg-card rounded-2xl p-5 mx-4 mb-4 border border-border">
      <Text className="text-muted-foreground text-sm mb-1">คงเหลือ</Text>
      <Text className={`text-3xl font-bold mb-4 ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
        {formatCurrency(Math.abs(balance))}
      </Text>

      <View className="flex-row justify-between">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-income/20 items-center justify-center mr-2">
            <Ionicons name="arrow-up" size={16} color="#22C55E" />
          </View>
          <View>
            <Text className="text-muted-foreground text-xs">รายรับ</Text>
            <Text className="text-income font-bold">{formatCurrency(totalIncome)}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-expense/20 items-center justify-center mr-2">
            <Ionicons name="arrow-down" size={16} color="#EF4444" />
          </View>
          <View>
            <Text className="text-muted-foreground text-xs">รายจ่าย</Text>
            <Text className="text-expense font-bold">{formatCurrency(totalExpense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
