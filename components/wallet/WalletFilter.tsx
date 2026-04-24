import { useWalletStore } from '@/lib/stores/wallet-store';
import { useIsDarkTheme } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AddWalletModal } from './AddWalletModal';

interface Props {
  selectedWalletId: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}

export function WalletFilter({ selectedWalletId, onChange, className }: Props) {
  const isDark = useIsDarkTheme();
  const wallets = useWalletStore(s => s.wallets);
  const [open, setOpen] = useState(false);
  const [addVisible, setAddVisible] = useState(false);

  const selectedWalletName = selectedWalletId
    ? wallets.find(w => w.id === selectedWalletId)?.name ?? 'กระเป๋า'
    : 'ทุกกระเป๋า';

  const handlePick = (id: string | null) => {
    Haptics.selectionAsync();
    onChange(id);
    setOpen(false);
  };

  return (
    <View className={className}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(true); }}
        className="flex-row items-center px-3.5 py-1.5 bg-card rounded-2xl self-start border border-border"
      >
        <Ionicons name="wallet-outline" size={15} color="#E87A3D" />
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground ml-1.5">{selectedWalletName}</Text>
        <Ionicons name="chevron-down" size={12} color="#A39685" style={{ marginLeft: 4 }} />
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
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">เลือกกระเป๋า</Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#A39685" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96">
              <Pressable
                onPress={() => handlePick(null)}
                className={`px-4 py-3 rounded-2xl mb-2 border flex-row items-center justify-between ${!selectedWalletId ? 'bg-primary border-primary' : 'border-border bg-background'}`}
              >
                <View className="flex-row items-center">
                  <View className="w-7 h-7 rounded-full items-center justify-center mr-2 bg-secondary">
                    <Ionicons name="albums-outline" size={14} color="#A39685" />
                  </View>
                  <Text
                    className={!selectedWalletId ? '' : 'text-foreground'}
                    style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: !selectedWalletId ? '#fff' : isDark ? "#E87A3D" : "#2B2118" }}
                  >
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
                        className={selected ? '' : 'text-foreground'}
                        style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: selected ? '#fff' : "#E87A3D" }}
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
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(false); setAddVisible(true); }}
                className="px-4 py-3 rounded-2xl border border-dashed border-primary/50 flex-row items-center"
              >
                <View className="w-7 h-7 rounded-full items-center justify-center mr-2 bg-primary/10">
                  <Ionicons name="add" size={16} color="#E87A3D" />
                </View>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-primary">เพิ่มกระเป๋า</Text>
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
