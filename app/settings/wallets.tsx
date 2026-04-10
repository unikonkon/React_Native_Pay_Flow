import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/lib/stores/wallet-store';
import type { Wallet, WalletType } from '@/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

const WALLET_TYPES: { value: WalletType; label: string; icon: string }[] = [
  { value: 'cash', label: 'เงินสด', icon: 'cash-outline' },
  { value: 'bank', label: 'ธนาคาร', icon: 'business-outline' },
  { value: 'credit_card', label: 'บัตรเครดิต', icon: 'card-outline' },
  { value: 'e_wallet', label: 'E-Wallet', icon: 'phone-portrait-outline' },
  { value: 'savings', label: 'บัญชีออมทรัพย์', icon: 'wallet-outline' },
  { value: 'daily_expense', label: 'ค่าใช้จ่ายรายวัน', icon: 'today-outline' },
];

const WALLET_COLORS = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export default function WalletsScreen() {
  const { wallets, addWallet, updateWallet, deleteWallet } = useWalletStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<WalletType>('cash');
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);

  const isEditing = !!editingWallet;

  const resetForm = useCallback(() => {
    setEditingWallet(null);
    setName('');
    setSelectedType('cash');
    setSelectedColor(WALLET_COLORS[0]);
  }, []);

  const openAddForm = useCallback(() => {
    resetForm();
    bottomSheetRef.current?.snapToIndex(0);
  }, [resetForm]);

  const openEditForm = useCallback((wallet: Wallet) => {
    if (wallet.id === 'wallet-cash') return;
    setEditingWallet(wallet);
    setName(wallet.name);
    setSelectedType(wallet.type);
    setSelectedColor(wallet.color);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    const typeInfo = WALLET_TYPES.find(t => t.value === selectedType)!;

    if (isEditing && editingWallet) {
      await updateWallet(editingWallet.id, {
        name: name.trim(),
        type: selectedType,
        icon: typeInfo.icon,
        color: selectedColor,
      });
    } else {
      await addWallet({
        name: name.trim(),
        type: selectedType,
        icon: typeInfo.icon,
        color: selectedColor,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    bottomSheetRef.current?.close();
  }, [name, selectedType, selectedColor, isEditing, editingWallet, addWallet, updateWallet, resetForm]);

  const handleDelete = useCallback((wallet: Wallet) => {
    if (wallet.id === 'wallet-cash') return;
    Alert.alert(
      'ลบกระเป๋าเงิน',
      `ต้องการลบ "${wallet.name}" ?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteWallet(wallet.id);
            if (!success) {
              Alert.alert('ไม่สามารถลบได้', 'กระเป๋านี้มีรายการอยู่ ต้องลบรายการก่อน');
            }
          },
        },
      ]
    );
  }, [deleteWallet]);

  const renderWalletItem = ({ item }: { item: Wallet }) => {
    const isDefault = item.id === 'wallet-cash';
    return (
      <Pressable
        onPress={() => openEditForm(item)}
        onLongPress={() => handleDelete(item)}
        className="flex-row items-center px-4 py-4 bg-card border-b border-border"
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: item.color }}
        >
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-medium text-base">{item.name}</Text>
          <Text className="text-muted-foreground text-xs">
            {WALLET_TYPES.find(t => t.value === item.type)?.label ?? item.type}
          </Text>
        </View>
        {isDefault && (
          <View className="bg-primary/10 px-2 py-1 rounded">
            <Text className="text-primary text-xs">ค่าเริ่มต้น</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id}
        renderItem={renderWalletItem}
      />

      <Pressable
        onPress={openAddForm}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={resetForm}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-foreground text-lg font-bold mb-4 text-center">
            {isEditing ? 'แก้ไขกระเป๋าเงิน' : 'เพิ่มกระเป๋าเงิน'}
          </Text>

          <Text className="text-foreground font-semibold mb-2">ชื่อ</Text>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder="ชื่อกระเป๋าเงิน"
            placeholderTextColor="#999"
            style={{
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 12,
              padding: 12,
              fontSize: 16,
              marginBottom: 16,
            }}
          />

          <Text className="text-foreground font-semibold mb-2">ประเภท</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {WALLET_TYPES.map((wt) => (
              <Pressable
                key={wt.value}
                onPress={() => setSelectedType(wt.value)}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  selectedType === wt.value ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <Ionicons name={wt.icon as keyof typeof Ionicons.glyphMap} size={16} color={selectedType === wt.value ? '#0891b2' : '#666'} />
                <Text className={`text-sm ml-1 ${selectedType === wt.value ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {wt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-foreground font-semibold mb-2">สี</Text>
          <View className="flex-row gap-3 mb-6">
            {WALLET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  selectedColor === color ? 'border-2 border-foreground' : ''
                }`}
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
            className={`py-4 rounded-xl items-center bg-primary ${!name.trim() ? 'opacity-50' : ''}`}
            disabled={!name.trim()}
          >
            <Text className="text-white font-bold text-lg">
              {isEditing ? 'อัพเดท' : 'เพิ่ม'}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
