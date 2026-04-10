import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import type { Category, Transaction, TransactionType, Wallet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { CategoryPicker } from './CategoryPicker';
import { WalletSelector } from '@/components/common/WalletSelector';
import { CalculatorPad } from '@/components/common/CalculatorPad';

interface TransactionFormProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  editTransaction?: Transaction | null;
  onDismiss?: () => void;
}

export function TransactionForm({ bottomSheetRef, editTransaction, onDismiss }: TransactionFormProps) {
  const snapPoints = useMemo(() => ['85%'], []);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEditMode = !!editTransaction;

  const categories = useCategoryStore(s => s.categories);
  const wallets = useWalletStore(s => s.wallets);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const updateTransaction = useTransactionStore(s => s.updateTransaction);

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount);
      setSelectedCategory(editTransaction.category ?? null);
      setSelectedWallet(wallets.find(w => w.id === editTransaction.walletId) ?? null);
      setDate(new Date(editTransaction.date));
      setNote(editTransaction.note ?? '');
    }
  }, [editTransaction, wallets]);

  const resetForm = useCallback(() => {
    setType('expense');
    setAmount(0);
    setSelectedCategory(null);
    setSelectedWallet(null);
    setDate(new Date());
    setNote('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!amount || !selectedCategory) return;

    if (isEditMode && editTransaction) {
      await updateTransaction(editTransaction.id, {
        type,
        amount,
        categoryId: selectedCategory.id,
        walletId: selectedWallet?.id ?? 'wallet-cash',
        note: note.trim() || undefined,
        date: date.toISOString().split('T')[0],
      });
    } else {
      await addTransaction({
        type,
        amount,
        categoryId: selectedCategory.id,
        walletId: selectedWallet?.id ?? 'wallet-cash',
        note: note.trim() || undefined,
        date: date.toISOString().split('T')[0],
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    onDismiss?.();
    bottomSheetRef.current?.close();
  }, [amount, selectedCategory, selectedWallet, type, note, date, isEditMode, editTransaction, addTransaction, updateTransaction, resetForm, onDismiss, bottomSheetRef]);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const toggleType = (newType: TransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    Haptics.selectionAsync();
  };

  const handleClose = useCallback(() => {
    if (!isEditMode) resetForm();
    onDismiss?.();
  }, [isEditMode, resetForm, onDismiss]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      handleIndicatorStyle={{ backgroundColor: '#ccc' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-foreground text-lg font-bold mb-4 text-center">
            {isEditMode ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}
          </Text>

          <View className="flex-row mb-4 rounded-xl overflow-hidden border border-border">
            <Pressable
              onPress={() => toggleType('expense')}
              className={`flex-1 py-3 items-center ${type === 'expense' ? 'bg-expense' : 'bg-card'}`}
            >
              <Text className={`font-bold ${type === 'expense' ? 'text-white' : 'text-foreground'}`}>
                รายจ่าย
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleType('income')}
              className={`flex-1 py-3 items-center ${type === 'income' ? 'bg-income' : 'bg-card'}`}
            >
              <Text className={`font-bold ${type === 'income' ? 'text-white' : 'text-foreground'}`}>
                รายรับ
              </Text>
            </Pressable>
          </View>

          <CalculatorPad value={amount} onChange={setAmount} type={type} />

          <WalletSelector
            wallets={wallets}
            selectedId={selectedWallet?.id}
            onSelect={setSelectedWallet}
          />

          <CategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategory?.id}
            onSelect={setSelectedCategory}
          />

          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center py-3 px-4 bg-secondary rounded-xl mb-4"
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text className="text-foreground ml-2">
              {date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              locale="th-TH"
            />
          )}

          <View className="mb-6">
            <Text className="text-foreground font-semibold mb-2">หมายเหตุ</Text>
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)"
              placeholderTextColor="#999"
              style={{
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
              }}
            />
          </View>

          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-xl items-center ${
              type === 'income' ? 'bg-income' : 'bg-expense'
            } ${!amount || !selectedCategory ? 'opacity-50' : ''}`}
            disabled={!amount || !selectedCategory}
          >
            <Text className="text-white font-bold text-lg">
              {isEditMode ? 'อัพเดท' : 'บันทึก'}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
