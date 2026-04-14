import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { AddWalletModal } from './AddWalletModal';

interface Props {
  selectedWalletId: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}

export function WalletFilter({ selectedWalletId, onChange, className }: Props) {
  const wallets = useWalletStore(s => s.wallets);
  const [open, setOpen] = useState(false);
  const [addVisible, setAddVisible] = useState(false);

  const selectedWalletName = selectedWalletId
    ? wallets.find(w => w.id === selectedWalletId)?.name ?? 'กระเป๋า'
    : 'ทุกกระเป๋า';

  return (
    <View className={className}>
      <Pressable
        onPress={() => setOpen(!open)}
        className="flex-row items-center px-3 py-2 bg-secondary rounded-lg self-start"
      >
        <Ionicons name="wallet-outline" size={16} color="#666" />
        <Text className="text-foreground text-sm ml-1">{selectedWalletName}</Text>
        <Ionicons name="chevron-down" size={14} color="#666" style={{ marginLeft: 4 }} />
      </Pressable>

      {open && (
        <View className="mt-2 bg-card rounded-xl border border-border overflow-hidden">
          <Pressable
            onPress={() => { onChange(null); setOpen(false); }}
            className={`px-4 py-3 border-b border-border ${!selectedWalletId ? 'bg-primary/10' : ''}`}
          >
            <Text className={`${!selectedWalletId ? 'text-primary font-semibold' : 'text-foreground'}`}>
              ทุกกระเป๋า
            </Text>
          </Pressable>
          {wallets.map(w => (
            <Pressable
              key={w.id}
              onPress={() => { onChange(w.id); setOpen(false); }}
              className={`flex-row items-center px-4 py-3 border-b border-border ${selectedWalletId === w.id ? 'bg-primary/10' : ''}`}
            >
              <View
                className="w-6 h-6 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: w.color }}
              >
                <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={12} color="white" />
              </View>
              <Text className={`${selectedWalletId === w.id ? 'text-primary font-semibold' : 'text-foreground'}`}>
                {w.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => { setOpen(false); setAddVisible(true); }}
            className="flex-row items-center px-4 py-3"
          >
            <View className="w-6 h-6 rounded-full items-center justify-center mr-2 bg-primary/10">
              <Ionicons name="add" size={14} color="#0891b2" />
            </View>
            <Text className="text-primary font-semibold">เพิ่มกระเป๋า</Text>
          </Pressable>
        </View>
      )}

      <AddWalletModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onCreated={(id) => { if (id) onChange(id); }}
      />
    </View>
  );
}
