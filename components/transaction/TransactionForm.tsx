import { AmountInput } from '@/components/ui/AmountInput';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTransactionStore } from '@/stores/transactionStore';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import { CategoryPicker } from './CategoryPicker';

const SHEET_COLORS = { light: '#F0F0F3', dark: '#1C1C1E' };

interface TransactionFormProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export function TransactionForm({ bottomSheetRef }: TransactionFormProps) {
  const snapPoints = useMemo(() => ['75%'], []);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const colorScheme = useColorScheme();
  const sheetBg = SHEET_COLORS[colorScheme === 'dark' ? 'dark' : 'light'];

  const categories = useCategoryStore(s => s.categories);
  const addTransaction = useTransactionStore(s => s.addTransaction);

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === type),
    [categories, type]
  );

  const resetForm = useCallback(() => {
    setAmount('');
    setSelectedCategory(null);
    setDate(new Date());
    setNote('');
  }, []);

  const handleSave = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || !selectedCategory) return;

    await addTransaction({
      type,
      amount: parsedAmount,
      categoryId: selectedCategory.id,
      note: note.trim() || undefined,
      date: date.toISOString().split('T')[0],
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    bottomSheetRef.current?.close();
  }, [amount, selectedCategory, type, note, date, addTransaction, resetForm, bottomSheetRef]);

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
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      // backgroundStyle={{ backgroundColor: 'var(--card)' }}
      handleIndicatorStyle={{ backgroundColor: '#ccc' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Type Toggle */}
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

          {/* Amount */}
          <AmountInput value={amount} onChangeText={setAmount} type={type} />

          {/* Category */}
          <CategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategory?.id}
            onSelect={setSelectedCategory}
          />

          {/* Date */}
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

          {/* Note */}
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

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-xl items-center ${
              type === 'income' ? 'bg-income' : 'bg-expense'
            } ${!amount || !selectedCategory ? 'opacity-50' : ''}`}
            disabled={!amount || !selectedCategory}
          >
            <Text className="text-white font-bold text-lg">บันทึก</Text>
          </Pressable>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
