import { useWalletStore } from '@/lib/stores/wallet-store';
import type { WalletType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated?: (walletId: string | undefined) => void;
}

const WALLET_TYPES: { value: WalletType; label: string; icon: string }[] = [
  { value: 'cash', label: 'เงินสด', icon: 'cash-outline' },
  { value: 'bank', label: 'ธนาคาร', icon: 'business-outline' },
  { value: 'credit_card', label: 'บัตรเครดิต', icon: 'card-outline' },
  { value: 'e_wallet', label: 'E-Wallet', icon: 'phone-portrait-outline' },
  { value: 'savings', label: 'บัญชีออมทรัพย์', icon: 'wallet-outline' },
  { value: 'daily_expense', label: 'ค่าใช้จ่ายรายวัน', icon: 'today-outline' },
];

const WALLET_COLORS = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export function AddWalletModal({ visible, onClose, onCreated }: Props) {
  const { addWallet, wallets } = useWalletStore();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<WalletType>('cash');
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setSelectedType('cash');
      setSelectedColor(WALLET_COLORS[0]);
      setSaving(false);
    }
  }, [visible]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    const typeInfo = WALLET_TYPES.find(t => t.value === selectedType)!;
    setSaving(true);
    const before = new Set(wallets.map(w => w.id));
    await addWallet({
      name: trimmed,
      type: selectedType,
      icon: typeInfo.icon,
      color: selectedColor,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const latest = useWalletStore.getState().wallets.find(w => !before.has(w.id));
    onCreated?.(latest?.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40 items-center justify-center"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-11/12 max-w-md bg-background rounded-2xl p-4 border border-border"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">เพิ่มกระเป๋าเงิน</Text>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#A39685" />
            </Pressable>
          </View>

          <ScrollView className="max-h-[480px]" keyboardShouldPersistTaps="handled">
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground mb-2">ชื่อ</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="ชื่อกระเป๋าเงิน"
              placeholderTextColor="#A39685"
              style={{ fontFamily: 'IBMPlexSansThai_400Regular' }}
              className="border border-border rounded-xl px-3 py-3 mb-4 text-foreground bg-background"
            />

            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground mb-2">ประเภท</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {WALLET_TYPES.map((wt) => {
                const active = selectedType === wt.value;
                return (
                  <Pressable
                    key={wt.value}
                    onPress={() => { Haptics.selectionAsync(); setSelectedType(wt.value); }}
                    className={`flex-row items-center px-3 py-2 rounded-full border ${active ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                  >
                    <Ionicons
                      name={wt.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={active ? '#E87A3D' : '#A39685'}
                    />
                    <Text style={{ fontFamily: active ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 14 }} className={`ml-1 ${active ? 'text-primary' : 'text-foreground'}`}>
                      {wt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground mb-2">สี</Text>
            <View className="flex-row flex-wrap gap-3 mb-5">
              {WALLET_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => { Haptics.selectionAsync(); setSelectedColor(color); }}
                  className={`w-9 h-9 rounded-full items-center justify-center ${selectedColor === color ? 'border-2 border-foreground' : ''}`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || saving}
              className={`py-3 rounded-full items-center bg-primary ${!name.trim() || saving ? 'opacity-50' : ''}`}
            >
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, color: '#fff' }}>เพิ่ม</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
