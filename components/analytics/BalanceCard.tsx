import { View, Text } from 'react-native';
import { formatCurrency } from '@/lib/utils/format';
import Svg, { Path } from 'react-native-svg';

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

function ArrowIcon({ direction, color }: { direction: 'up' | 'down'; color: string }) {
  const d = direction === 'up'
    ? 'M12 18 L12 6 M6 12 L12 6 L18 12'
    : 'M12 6 L12 18 M6 12 L12 18 L18 12';
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StatBox({ icon, label, value, color }: { icon: 'up' | 'down'; label: string; value: number; color: string }) {
  const bgColor = icon === 'up' ? 'rgba(92,184,138,0.18)' : 'rgba(229,115,115,0.18)';
  return (
    <View className="flex-1 flex-row items-center bg-secondary rounded-xl" style={{ padding: 10, gap: 10 }}>
      <View className="rounded-full items-center justify-center" style={{ width: 28, height: 28, backgroundColor: bgColor }}>
        <ArrowIcon direction={icon} color={color} />
      </View>
      <View>
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">{label}</Text>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, fontVariant: ['tabular-nums'], color }}>{formatCurrency(value)}</Text>
      </View>
    </View>
  );
}

export function BalanceCard({ totalIncome, totalExpense, balance }: BalanceCardProps) {
  return (
    <View className="bg-card rounded-2xl mx-4 mb-4" style={{ padding: 16, paddingHorizontal: 18, shadowColor: '#2B2118', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground">คงเหลือ</Text>
      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 30, fontVariant: ['tabular-nums'], letterSpacing: -0.5, marginTop: 2 }} className={balance >= 0 ? 'text-income' : 'text-expense'}>
        {formatCurrency(Math.abs(balance))}
      </Text>

      <View className="flex-row" style={{ gap: 10, marginTop: 14 }}>
        <StatBox icon="up" label="รายรับ" value={totalIncome} color="#4A9E75" />
        <StatBox icon="down" label="รายจ่าย" value={totalExpense} color="#D85F5F" />
      </View>
    </View>
  );
}
