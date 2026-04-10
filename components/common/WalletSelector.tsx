import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Wallet } from '@/types';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedId?: string;
  onSelect: (wallet: Wallet) => void;
}

export function WalletSelector({ wallets, selectedId, onSelect }: WalletSelectorProps) {
  return (
    <View className="mb-4">
      <Text className="text-foreground font-semibold mb-2">กระเป๋าเงิน</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {wallets.map((wallet) => {
            const isSelected = wallet.id === selectedId;
            return (
              <Pressable
                key={wallet.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(wallet);
                }}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <View
                  className="w-7 h-7 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: wallet.color }}
                >
                  <Ionicons name={wallet.icon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
                </View>
                <Text className={`text-sm ${isSelected ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {wallet.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
