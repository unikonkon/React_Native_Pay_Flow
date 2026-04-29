import { getThemeSwatch } from '@/lib/constants/themes';
import { getDb, getSummaryByRange, getWalletTransactionCount } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import type { Wallet, WalletType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const WALLET_TYPES: { value: WalletType; label: string; icon: string }[] = [
  { value: 'cash', label: 'เงินสด', icon: 'cash-outline' },
  { value: 'bank', label: 'ธนาคาร', icon: 'business-outline' },
  { value: 'credit_card', label: 'บัตรเครดิต', icon: 'card-outline' },
  { value: 'e_wallet', label: 'E-Wallet', icon: 'phone-portrait-outline' },
  { value: 'savings', label: 'บัญชีออมทรัพย์', icon: 'wallet-outline' },
  { value: 'daily_expense', label: 'ค่าใช้จ่ายรายวัน', icon: 'today-outline' },
];

const WALLET_COLORS = ['#53C26E', '#3D7EF0', '#E25757', '#E8A93D', '#7E6DE0', '#E06DAB', '#3FB59B', '#4A5FE0'];

export default function WalletsScreen() {
  const { wallets, addWallet, updateWallet, deleteWallet, reorderWallets } = useWalletStore();
  const defaultWalletId = useSettingsStore(s => s.defaultWalletId);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const reloadTransactions = useTransactionStore(s => s.loadTransactions);
  const currentTheme = useThemeStore(s => s.currentTheme);
  const swatch = getThemeSwatch(currentTheme);
  const sheetBg = swatch?.bg ?? '#FBF7F0';
  const sheetCard = swatch?.card ?? '#FFFFFF';
  const sheetBorder = swatch?.border ?? '#EDE4D3';
  const sheetInk = swatch?.ink ?? '#2A2320';
  const sheetInkMuted = swatch?.inkMuted ?? '#A39685';
  const sheetAccent = swatch?.accent ?? '#F5D9B8';
  const sheetPrimary = swatch?.primary ?? '#E87A3D';
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);
  const insets = useSafeAreaInsets();

  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<WalletType>('cash');
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [actionWallet, setActionWallet] = useState<Wallet | null>(null);
  const [txCounts, setTxCounts] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<{ income: number; expense: number }>({ income: 0, expense: 0 });

  const isEditing = !!editingWallet;

  // Load transaction counts per wallet + lifetime totals across all wallets
  useEffect(() => {
    (async () => {
      const db = getDb();
      const counts: Record<string, number> = {};
      for (const w of wallets) {
        counts[w.id] = await getWalletTransactionCount(db, w.id);
      }
      setTxCounts(counts);

      const summary = await getSummaryByRange(db, '1900-01-01', '9999-12-31');
      setTotals({ income: summary.totalIncome, expense: summary.totalExpense });
    })();
  }, [wallets]);

  const totalBalance = totals.income - totals.expense;

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
    setEditingWallet(wallet);
    setName(wallet.name);
    setSelectedType(wallet.type);
    setSelectedColor(wallet.color);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSetDefault = useCallback(async (wallet: Wallet) => {
    await updateSettings({ defaultWalletId: wallet.id });
    Haptics.selectionAsync();
    setActionWallet(null);
  }, [updateSettings]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    const typeInfo = WALLET_TYPES.find(t => t.value === selectedType)!;
    if (isEditing && editingWallet) {
      await updateWallet(editingWallet.id, {
        name: name.trim(), type: selectedType, icon: typeInfo.icon, color: selectedColor,
      });
    } else {
      await addWallet({
        name: name.trim(), type: selectedType, icon: typeInfo.icon, color: selectedColor,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    bottomSheetRef.current?.close();
  }, [name, selectedType, selectedColor, isEditing, editingWallet, addWallet, updateWallet, resetForm]);

  const handleDelete = useCallback(async (wallet: Wallet) => {
    if (wallet.id === defaultWalletId) {
      Alert.alert('ไม่สามารถลบได้', 'กระเป๋านี้ถูกตั้งเป็นค่าเริ่มต้น กรุณาเปลี่ยนค่าเริ่มต้นก่อน');
      return;
    }
    const txCount = await getWalletTransactionCount(getDb(), wallet.id);
    const message = txCount > 0
      ? `ต้องการลบ "${wallet.name}" ?\nรายการที่เกี่ยวข้อง ${txCount} รายการจะถูกลบด้วย`
      : `ต้องการลบ "${wallet.name}" ?`;
    Alert.alert('ลบกระเป๋าเงิน', message, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive',
        onPress: async () => {
          await deleteWallet(wallet.id);
          await reloadTransactions();
          setActionWallet(null);
        },
      },
    ]);
  }, [deleteWallet, defaultWalletId, reloadTransactions]);

  const handleClearWalletData = useCallback(async (wallet: Wallet) => {
    const txCount = await getWalletTransactionCount(getDb(), wallet.id);
    if (txCount === 0) {
      Alert.alert('ไม่มีข้อมูล', `กระเป๋า "${wallet.name}" ไม่มีรายการรายรับ-รายจ่าย`);
      return;
    }
    Alert.alert('ล้างข้อมูลกระเป๋า', `ต้องการลบรายการทั้งหมด ${txCount} รายการ ของ "${wallet.name}" ?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ล้างข้อมูล', style: 'destructive',
        onPress: async () => {
          const db = getDb();
          await db.runAsync('DELETE FROM transactions WHERE wallet_id = ?', [wallet.id]);
          await db.runAsync('DELETE FROM analysis WHERE wallet_id = ?', [wallet.id]);
          await reloadTransactions();
          setActionWallet(null);
          Alert.alert('สำเร็จ', `ล้างข้อมูล "${wallet.name}" เรียบร้อยแล้ว`);
        },
      },
    ]);
  }, [reloadTransactions]);

  const handleDragEnd = useCallback(async ({ data }: { data: Wallet[] }) => {
    await reorderWallets(data.map(w => w.id));
    Haptics.selectionAsync();
  }, [reorderWallets]);

  const formatBalance = (n: number) => {
    const abs = Math.abs(n).toLocaleString('en-US');
    return (n < 0 ? '−฿' : '฿') + abs;
  };

  const renderWalletItem = useCallback(({ item, drag, isActive }: RenderItemParams<Wallet>) => {
    const isDefault = item.id === defaultWalletId;
    const count = txCounts[item.id] ?? 0;
    const typeLabel = WALLET_TYPES.find(t => t.value === item.type)?.label ?? item.type;

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          className="bg-card"
          style={{
            marginBottom: 10,
            borderRadius: 16, padding: 12, paddingHorizontal: 14,
            flexDirection: 'row', alignItems: 'center', gap: 12,
            shadowColor: '#2A2320', shadowOpacity: isActive ? 0.12 : 0.05,
            shadowRadius: isActive ? 20 : 16, shadowOffset: { width: 0, height: 4 }, elevation: isActive ? 8 : 2,
            position: 'relative', overflow: 'hidden',
          }}
        >

          {/* Icon */}
          <View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: item.color + '22',
            borderWidth: 1.5, borderColor: item.color,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={item.color} />
          </View>

          {/* Name + type */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14.5 }} numberOfLines={1}>
                {item.name}
              </Text>
              {isDefault && (
                <View style={{ backgroundColor: '#FCE8D4', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 10, color: '#C85F28' }}>หลัก</Text>
                </View>
              )}
            </View>
            <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginTop: 1 }}>
              {typeLabel} · ใช้ {count} ครั้ง
            </Text>
          </View>

          {/* Actions */}
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
              <Pressable
                onPress={() => openEditForm(item)}
                style={{
                  width: 38, height: 38, borderRadius: 7,
                  borderWidth: 1, borderColor: 'rgba(42,35,32,0.28)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="create-outline" size={11} color="#9A8D80" />
              </Pressable>
              <Pressable
                onPress={() => setActionWallet(item)}
                style={{
                  width: 38, height: 38, borderRadius: 7,
                  borderWidth: 1, borderColor: 'rgba(42,35,32,0.28)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={11} color="#9A8D80" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  }, [defaultWalletId, txCounts, openEditForm]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Header */}
        <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => router.back()}
            className="bg-secondary"
            style={{
              width: 36, height: 36, borderRadius: 18,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={18} color="#A39685" />
          </Pressable>
          <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 20, flex: 1, letterSpacing: -0.3 }}>
            จัดการกระเป๋าเงิน
          </Text>
        </View>

        {/* Summary card */}
        <View style={{
          marginHorizontal: 16, marginBottom: 14, padding: 14, paddingHorizontal: 16, paddingBottom: 16,
          borderRadius: 18, overflow: 'hidden', position: 'relative',
        }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FCE8D4' }} />
          <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '50%', backgroundColor: '#D8CCEC', opacity: 0.5, borderTopLeftRadius: 60 }} />
          <View style={{ zIndex: 1 }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#6B5F55' }}>ยอดคงเหลือ</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#2A2320', marginTop: 2, letterSpacing: -0.5, fontVariant: ['tabular-nums'] }}>
              ฿{totalBalance.toLocaleString('en-US')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 15, color: '#6B5F55' }}>
                รายรับ <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#2A8C4D' }}>฿{totals.income.toLocaleString('en-US')}</Text>
              </Text>
              <View style={{ width: 1, backgroundColor: 'rgba(42,35,32,0.15)' }} />
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 15, color: '#6B5F55' }}>
                รายจ่าย <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#C24040' }}>฿{totals.expense.toLocaleString('en-US')}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Section header */}
        <View style={{ marginHorizontal: 22, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#9A8D80', flex: 1, letterSpacing: 0.3 }}>
            กระเป๋าของฉัน ({wallets.length})
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="grid-outline" size={12} color="#9A8D80" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: '#9A8D80' }}>ลากเพื่อจัดลำดับ</Text>
          </View>
        </View>

        {/* Draggable wallet list */}
        <DraggableFlatList
          data={wallets}
          keyExtractor={(item) => item.id}
          renderItem={renderWalletItem}
          onDragEnd={handleDragEnd}
          containerStyle={{ flex: 1, paddingHorizontal: 16 }}
        />

        {/* Footer outside list */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 }}>
          {/* Add button (dashed) */}
          <Pressable
            onPress={openAddForm}
            style={{
              borderRadius: 16, padding: 18,
              borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E87A3D',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Ionicons name="add" size={16} color="#E87A3D" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14.5, color: '#E87A3D' }}>เพิ่มกระเป๋าเงิน</Text>
          </Pressable>

          {/* Hint footer */}
          <View style={{
            padding: 10, paddingHorizontal: 12, marginTop: 10,
            backgroundColor: 'rgba(232,181,71,0.15)', borderRadius: 10,
            flexDirection: 'row', alignItems: 'flex-start', gap: 8,
          }}>
            <Ionicons name="information-circle" size={16} color="#E8B547" style={{ marginTop: 1 }} />
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: '#6B5F55', lineHeight: 17, flex: 1 }}>
              ลบกระเป๋าแล้วรายการธุรกรรมจะถูกลบด้วย คุณสามารถล้างข้อมูลกระเป๋าได้ก่อนลบ
            </Text>
          </View>
        </View>

        {/* Bottom Sheet: Add/Edit Form */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          topInset={insets.top}
          enablePanDownToClose
          onClose={resetForm}
          backgroundStyle={{ backgroundColor: sheetBg }}
          handleIndicatorStyle={{ backgroundColor: sheetBorder, width: 36, height: 4 }}
        >
          <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 + insets.bottom }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18, textAlign: 'center', marginBottom: 16, color: sheetInk }}>
              {isEditing ? 'แก้ไขกระเป๋าเงิน' : 'เพิ่มกระเป๋าเงิน'}
            </Text>

            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6, color: sheetInk }}>ชื่อ</Text>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder="ชื่อกระเป๋าเงิน"
              placeholderTextColor={sheetInkMuted}
              style={{
                height: 42, paddingHorizontal: 14, borderRadius: 10,
                borderWidth: 1, borderColor: sheetBorder,
                backgroundColor: sheetCard,
                fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14, color: sheetInk,
                marginBottom: 14,
              }}
            />

            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6, color: sheetInk }}>ประเภท</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {WALLET_TYPES.map((wt) => {
                const on = selectedType === wt.value;
                return (
                  <Pressable
                    key={wt.value}
                    onPress={() => setSelectedType(wt.value)}
                    style={{
                      height: 36, paddingHorizontal: 12, borderRadius: 999,
                      backgroundColor: on ? `${sheetPrimary}22` : sheetCard,
                      borderWidth: on ? 1.5 : 1, borderColor: on ? sheetPrimary : sheetBorder,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Ionicons name={wt.icon as keyof typeof Ionicons.glyphMap} size={14} color={on ? sheetPrimary : sheetInkMuted} />
                    <Text style={{
                      fontFamily: on ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                      fontSize: 13, color: on ? sheetPrimary : sheetInk,
                    }}>{wt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 8, color: sheetInk }}>สี</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              {WALLET_COLORS.map((c) => {
                const on = selectedColor === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={{
                      width: 34, height: 34, borderRadius: 17,
                      backgroundColor: c,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: on ? 3 : 0, borderColor: sheetBg,
                      shadowColor: on ? c : 'transparent', shadowOpacity: on ? 0.5 : 0, shadowRadius: 6,
                      shadowOffset: { width: 0, height: 0 }, elevation: on ? 4 : 0,
                    }}
                  >
                    {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleSave}
              disabled={!name.trim()}
              style={{
                height: 48, borderRadius: 999,
                backgroundColor: name.trim() ? sheetPrimary : sheetAccent,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: name.trim() ? sheetPrimary : 'transparent',
                shadowOpacity: name.trim() ? 0.35 : 0, shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 }, elevation: name.trim() ? 6 : 0,
              }}
            >
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15.5, color: '#fff' }}>
                {isEditing ? 'อัพเดท' : 'เพิ่ม'}
              </Text>
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheet>

        {/* Action Modal */}
        <Modal visible={!!actionWallet} transparent animationType="fade" onRequestClose={() => setActionWallet(null)}>
          <Pressable onPress={() => setActionWallet(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '88%', maxWidth: 360, borderRadius: 20, padding: 18, backgroundColor: sheetCard }}>
              {actionWallet && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: actionWallet.color + '22', borderWidth: 1.5, borderColor: actionWallet.color,
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      <Ionicons name={actionWallet.icon as keyof typeof Ionicons.glyphMap} size={18} color={actionWallet.color} />
                    </View>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18, flex: 1, color: sheetInk }} numberOfLines={1}>
                      {actionWallet.name}
                    </Text>
                    <Pressable onPress={() => setActionWallet(null)}>
                      <Ionicons name="close" size={22} color={sheetInkMuted} />
                    </Pressable>
                  </View>

                  <ActionRow icon="star-outline" color={sheetPrimary} label={actionWallet.id === defaultWalletId ? 'เป็นค่าเริ่มต้นอยู่แล้ว' : 'ตั้งเป็นค่าเริ่มต้น'}
                    inkColor={sheetInk} dividerColor={sheetBorder}
                    disabled={actionWallet.id === defaultWalletId} onPress={() => handleSetDefault(actionWallet)} />
                  <ActionRow icon="create-outline" color={sheetInkMuted} label="แก้ไข"
                    inkColor={sheetInk} dividerColor={sheetBorder}
                    onPress={() => { const w = actionWallet; setActionWallet(null); openEditForm(w); }} />
                  <ActionRow icon="document-text-outline" color="#F59E0B" label="ล้างรายการในกระเป๋า"
                    inkColor={sheetInk} dividerColor={sheetBorder}
                    onPress={() => handleClearWalletData(actionWallet)} />
                  <ActionRow icon="trash-outline" color="#D04040" label="ลบกระเป๋า" last
                    inkColor={sheetInk} dividerColor={sheetBorder}
                    disabled={actionWallet.id === defaultWalletId} onPress={() => handleDelete(actionWallet)} />
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function ActionRow({ icon, color, label, disabled, last, inkColor, dividerColor, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; color: string; label: string;
  disabled?: boolean; last?: boolean; inkColor: string; dividerColor: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 4,
        borderBottomWidth: last ? 0 : 0.5, borderBottomColor: dividerColor,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 15, color: inkColor, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}
