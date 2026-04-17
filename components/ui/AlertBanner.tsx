import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';

interface AlertBannerProps {
  currentExpense: number;
  target: number;
}

export function AlertBanner({ currentExpense, target }: AlertBannerProps) {
  if (target <= 0) return null;

  const percentage = Math.round((currentExpense / target) * 100);

  if (percentage < 80) return null;

  const isDanger = percentage >= 100;

  return (
    <View className={`mx-4 mt-2 p-3 rounded-2xl flex-row items-center ${isDanger ? 'bg-expense/15' : 'bg-[#F59E0B]/15'}`}>
      <Ionicons
        name={isDanger ? 'alert-circle' : 'warning'}
        size={20}
        color={isDanger ? '#EF4444' : '#F59E0B'}
      />
      <View className="flex-1 ml-2">
        <Text className={`font-semibold text-sm ${isDanger ? 'text-expense' : 'text-[#F59E0B]'}`}>
          {isDanger ? 'เกินเป้า!' : 'ใกล้ถึงเป้า'}
        </Text>
        <Text className="text-muted-foreground text-xs">
          ใช้จ่ายแล้ว {formatCurrency(currentExpense)} จากเป้า {formatCurrency(target)} ({percentage}%)
        </Text>
      </View>
    </View>
  );
}
