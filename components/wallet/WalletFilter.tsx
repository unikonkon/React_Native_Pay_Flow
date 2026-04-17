import { useWalletStore } from '@/lib/stores/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
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

  const handlePick = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <View className={className}>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center px-3 py-2 bg-secondary rounded-xl self-start"
      >
        <Ionicons name="wallet-outline" size={16} color="#6B5F52" />
        <Text className="text-foreground text-sm ml-1">{selectedWalletName}</Text>
        <Ionicons name="chevron-down" size={14} color="#6B5F52" style={{ marginLeft: 4 }} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/40 items-center justify-center"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-11/12 max-w-md bg-card rounded-2xl p-4 border border-border"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-lg">เลือกกระเป๋า</Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#6B5F52" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96">
              <Pressable
                onPress={() => handlePick(null)}
                className={`px-4 py-3 rounded-2xl mb-2 border flex-row items-center justify-between ${!selectedWalletId ? 'bg-primary border-primary' : 'border-border bg-background'}`}
              >
                <View className="flex-row items-center">
                  <View className="w-7 h-7 rounded-full items-center justify-center mr-2 bg-secondary">
                    <Ionicons name="albums-outline" size={14} color="#6B5F52" />
                  </View>
                  <Text className={`text-sm font-semibold ${!selectedWalletId ? 'text-primary-foreground' : 'text-foreground'}`}>
                    ทุกกระเป๋า
                  </Text>
                </View>
                {!selectedWalletId && <Ionicons name="checkmark" size={18} color="white" />}
              </Pressable>

              {wallets.map(w => {
                const selected = selectedWalletId === w.id;
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => handlePick(w.id)}
                    className={`px-4 py-3 rounded-2xl mb-2 border flex-row items-center justify-between ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center mr-2"
                        style={{ backgroundColor: w.color }}
                      >
                        <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={14} color="white" />
                      </View>
                      <Text
                        className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
                        numberOfLines={1}
                      >
                        {w.name}
                      </Text>
                    </View>
                    {selected && <Ionicons name="checkmark" size={18} color="white" />}
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => { setOpen(false); setAddVisible(true); }}
                className="px-4 py-3 rounded-2xl border border-dashed border-primary/50 flex-row items-center"
              >
                <View className="w-7 h-7 rounded-full items-center justify-center mr-2 bg-primary/10">
                  <Ionicons name="add" size={16} color="#E87A3D" />
                </View>
                <Text className="text-primary font-semibold text-sm">เพิ่มกระเป๋า</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <AddWalletModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onCreated={(id) => { if (id) onChange(id); }}
      />
    </View>
  );
}
