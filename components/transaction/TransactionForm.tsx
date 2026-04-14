import { CalculatorPad } from '@/components/common/CalculatorPad';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import type { Category, Transaction, TransactionType, Wallet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CategoryPicker } from './CategoryPicker';

interface TransactionFormProps {
  editTransaction?: Transaction | null;
  onClose: () => void;
}

export function TransactionForm({ editTransaction, onClose }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Only treat as edit mode if editing an existing transaction (has real id)
  const isEditMode = !!(editTransaction && editTransaction.id);

  const categories = useCategoryStore(s => s.categories);
  const wallets = useWalletStore(s => s.wallets);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const updateTransaction = useTransactionStore(s => s.updateTransaction);

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === type),
    [categories, type]
  );

  // Pre-fill when editing or from frequent/prefill data
  useEffect(() => {
    if (!editTransaction) return;
    setType(editTransaction.type);
    setAmount(editTransaction.amount);
    setSelectedCategory(editTransaction.category ?? categories.find(c => c.id === editTransaction.categoryId) ?? null);
    setSelectedWallet(wallets.find(w => w.id === editTransaction.walletId) ?? null);
    setDate(editTransaction.date ? new Date(editTransaction.date) : new Date());
    setNote(editTransaction.note ?? '');
  }, [editTransaction, wallets, categories]);

  // Default wallet if none selected
  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      setSelectedWallet(wallets[0]);
    }
  }, [wallets, selectedWallet]);

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
    onClose();
  }, [amount, selectedCategory, selectedWallet, type, note, date, isEditMode, editTransaction, addTransaction, updateTransaction, onClose]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Android: system auto-dismisses the dialog; event.type is 'set' or 'dismissed'
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setDate(selectedDate);
      }
      return;
    }
    // iOS: picker stays open inside our Modal; just update value as user spins
    if (selectedDate) setDate(selectedDate);
  };

  const toggleType = (newType: TransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    Haptics.selectionAsync();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header — type toggle + close */}
      <View className="flex-row items-center px-4 py-2 border-b border-border">
        <View className="flex-1 flex-row items-center justify-center">
          <View className="flex-row rounded-full overflow-hidden border border-border">
            <Pressable
              onPress={() => toggleType('expense')}
              className={`flex-row items-center px-4 py-1.5 ${type === 'expense' ? 'bg-expense' : 'bg-card'}`}
            >
              <Ionicons name="remove-circle-outline" size={14} color={type === 'expense' ? 'white' : '#666'} />
              <Text className={`font-bold ml-1 text-sm ${type === 'expense' ? 'text-white' : 'text-foreground'}`}>
                รายจ่าย
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleType('income')}
              className={`flex-row items-center px-4 py-1.5 ${type === 'income' ? 'bg-income' : 'bg-card'}`}
            >
              <Ionicons name="add-circle-outline" size={14} color={type === 'income' ? 'white' : '#666'} />
              <Text className={`font-bold ml-1 text-sm ${type === 'income' ? 'text-white' : 'text-foreground'}`}>
                รายรับ
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <Ionicons name="close" size={24} color="#666" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Category grid (vertical scroll) */}
          <CategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategory?.id}
            onSelect={setSelectedCategory}
          />

          {/* Date + Wallet chips — inline selector */}
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center py-1.5 px-3 bg-secondary rounded-full mr-2"
            >
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text className="text-foreground text-xs ml-1">
                {date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              </Text>
            </Pressable>

            {/* Wallet selector — horizontal scroll alongside date */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              <View className="flex-row gap-1.5">
                {wallets.map(w => {
                  const isSelected = w.id === selectedWallet?.id;
                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedWallet(w);
                      }}
                      className={`flex-row items-center py-1.5 px-3 rounded-full border ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-secondary'
                      }`}
                    >
                      <View
                        className="w-4 h-4 rounded-full items-center justify-center mr-1"
                        style={{ backgroundColor: w.color }}
                      >
                        <Ionicons
                          name={w.icon as keyof typeof Ionicons.glyphMap}
                          size={10}
                          color="white"
                        />
                      </View>
                      <Text
                        className={`text-xs ${
                          isSelected ? 'text-primary font-semibold' : 'text-foreground'
                        }`}
                      >
                        {w.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Android: native dialog — only render when opened, system handles modal */}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {/* iOS: Modal with spinner + Done/Cancel buttons for reliable visibility */}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Pressable
                  style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                  onPress={() => setShowDatePicker(false)}
                />
                <View style={{ backgroundColor: 'white', paddingBottom: 24 }}>
                  <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text className="text-muted-foreground font-medium text-base">ยกเลิก</Text>
                    </Pressable>
                    <Text className="text-foreground font-semibold text-base">เลือกวันที่</Text>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text className="text-primary font-semibold text-base">ตกลง</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    locale="th-TH"
                    themeVariant="light"
                    textColor="#000000"
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Note + Amount */}
          <View className="flex-row items-center border border-border rounded-xl px-3 py-1.5 mb-2">
            <Ionicons name="create-outline" size={14} color="#999" />
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="บันทึก..."
              placeholderTextColor="#999"
              style={{ flex: 1, marginLeft: 6, fontSize: 13, color: '#0a0a0a', paddingVertical: 2 }}
            />
            <Text className={`text-lg font-bold ${type === 'income' ? 'text-income' : 'text-expense'}`}>
              {amount > 0 ? `฿${amount.toLocaleString('th-TH')}` : '฿0'}
            </Text>
          </View>

          {/* Calculator Keypad + Save Button */}
          <CalculatorPad
            value={amount}
            onChange={setAmount}
            type={type}
            onSave={handleSave}
            saveLabel={isEditMode ? 'อัพเดท' : 'บันทึก'}
            saveDisabled={!amount || !selectedCategory}
          />
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
