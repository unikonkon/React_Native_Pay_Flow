import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction, Wallet } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface WalletsContentProps {
  wallets: Wallet[];
  transactions: Transaction[];
}

export function WalletsContent({ wallets, transactions }: WalletsContentProps) {
  if (wallets.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-muted-foreground">ไม่มีกระเป๋าเงิน</Text>
      </View>
    );
  }

  const walletStats = wallets.map(wallet => {
    const walletTxs = transactions.filter(t => t.walletId === wallet.id);
    const income = walletTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = walletTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { wallet, income, expense, balance: income - expense };
  });

  const maxBalance = Math.max(...walletStats.map(w => Math.abs(w.balance)), 1);

  return (
    <View className="px-4 mb-4">
      <Text className="text-foreground font-bold text-base mb-3">เปรียบเทียบกระเป๋าเงิน</Text>
      {walletStats.map(({ wallet, income, expense, balance }) => {
        const barWidth = Math.max((Math.abs(balance) / maxBalance) * 100, 5);
        return (
          <View key={wallet.id} className="mb-4">
            <View className="flex-row items-center mb-1">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: wallet.color }}
              >
                <Ionicons name={wallet.icon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
              </View>
              <Text className="text-foreground font-medium flex-1">{wallet.name}</Text>
              <Text className={`font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(Math.abs(balance))}
              </Text>
            </View>
            <View className="h-3 bg-secondary rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${balance >= 0 ? 'bg-income' : 'bg-expense'}`}
                style={{ width: `${barWidth}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-income text-xs">+{formatCurrency(income)}</Text>
              <Text className="text-expense text-xs">-{formatCurrency(expense)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
