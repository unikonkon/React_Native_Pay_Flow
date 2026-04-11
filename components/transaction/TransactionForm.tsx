import { CalculatorPad } from '@/components/common/CalculatorPad';
import { WalletSelector } from '@/components/common/WalletSelector';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import type { Category, Transaction, TransactionType, Wallet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const toggleType = (newType: TransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    Haptics.selectionAsync();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header — type toggle + close */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <View className="flex-1 flex-row items-center justify-center">
          <View className="flex-row rounded-full overflow-hidden border border-border">
            <Pressable
              onPress={() => toggleType('expense')}
              className={`flex-row items-center px-5 py-2 ${type === 'expense' ? 'bg-expense' : 'bg-card'}`}
            >
              <Ionicons name="remove-circle-outline" size={16} color={type === 'expense' ? 'white' : '#666'} />
              <Text className={`font-bold ml-1 ${type === 'expense' ? 'text-white' : 'text-foreground'}`}>
                รายจ่าย
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleType('income')}
              className={`flex-row items-center px-5 py-2 ${type === 'income' ? 'bg-income' : 'bg-card'}`}
            >
              <Ionicons name="add-circle-outline" size={16} color={type === 'income' ? 'white' : '#666'} />
              <Text className={`font-bold ml-1 ${type === 'income' ? 'text-white' : 'text-foreground'}`}>
                รายรับ
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable onPress={onClose} className="p-2">
          <Ionicons name="close" size={26} color="#666" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Wallet */}
          <WalletSelector
            wallets={wallets}
            selectedId={selectedWallet?.id}
            onSelect={setSelectedWallet}
          />

          {/* Category grid (vertical scroll) */}
          <CategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategory?.id}
            onSelect={setSelectedCategory}
          />

          {/* Date + Amount display */}
          <View className="flex-row items-center mb-3">
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center py-2 px-3 bg-secondary rounded-xl mr-2"
            >
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text className="text-foreground text-sm ml-1">
                {date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              </Text>
            </Pressable>
            {selectedWallet && (
              <View className="flex-row items-center py-2 px-3 bg-secondary rounded-xl">
                <View className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: selectedWallet.color }} />
                <Text className="text-foreground text-sm">{selectedWallet.name}</Text>
              </View>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              locale="th-TH"
            />
          )}

          {/* Note + Amount */}
          <View className="flex-row items-center border border-border rounded-xl px-3 py-2 mb-4">
            <Ionicons name="create-outline" size={16} color="#999" />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="บันทึก..."
              placeholderTextColor="#999"
              className="flex-1 text-foreground ml-2 text-sm"
            />
            <Text className={`text-xl font-bold ${type === 'income' ? 'text-income' : 'text-expense'}`}>
              {amount > 0 ? `฿${amount.toLocaleString('th-TH')}` : '฿0'}
            </Text>
          </View>

          {/* Calculator Keypad */}
          <CalculatorPad value={amount} onChange={setAmount} type={type} />

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            className={`mt-4 py-4 rounded-xl items-center ${
              type === 'income' ? 'bg-income' : 'bg-expense'
            } ${!amount || !selectedCategory ? 'opacity-50' : ''}`}
            disabled={!amount || !selectedCategory}
          >
            <Text className="text-white font-bold text-lg">
              {isEditMode ? 'อัพเดท' : 'บันทึก'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
