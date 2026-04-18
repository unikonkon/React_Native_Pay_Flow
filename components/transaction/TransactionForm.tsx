import { CalculatorPad } from '@/components/common/CalculatorPad';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getDistinctNotesByCategory } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
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
  const [noteFocused, setNoteFocused] = useState(false);
  const [pastNotes, setPastNotes] = useState<string[]>([]);
  const [categoryTab, setCategoryTab] = useState<'recommend' | 'select' | 'manage'>('recommend');

  // Only treat as edit mode if editing an existing transaction (has real id)
  const isEditMode = !!(editTransaction && editTransaction.id);

  const categories = useCategoryStore(s => s.categories);
  const wallets = useWalletStore(s => s.wallets);
  const defaultWalletId = useSettingsStore(s => s.defaultWalletId);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
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

  // Load past notes when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setPastNotes([]);
      return;
    }
    getDistinctNotesByCategory(getDb(), selectedCategory.id).then(setPastNotes);
  }, [selectedCategory]);

  // Default wallet: prefer wallet selected on main screen, then defaultWalletId
  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      const preferred =
        wallets.find(w => w.id === selectedWalletId) ??
        wallets.find(w => w.id === defaultWalletId) ??
        wallets[0];
      setSelectedWallet(preferred);
    }
  }, [wallets, selectedWallet, selectedWalletId, defaultWalletId]);

  const handleSave = useCallback(async () => {
    if (!amount || !selectedCategory) return;

    const walletId = selectedWallet?.id ?? defaultWalletId;

    if (isEditMode && editTransaction) {
      await updateTransaction(editTransaction.id, {
        type,
        amount,
        categoryId: selectedCategory.id,
        walletId,
        note: note.trim() || undefined,
        date: date.toISOString().split('T')[0],
      });
    } else {
      await addTransaction({
        type,
        amount,
        categoryId: selectedCategory.id,
        walletId,
        note: note.trim() || undefined,
        date: date.toISOString().split('T')[0],
      });
    }

    onClose();
  }, [amount, selectedCategory, selectedWallet, defaultWalletId, type, note, date, isEditMode, editTransaction, addTransaction, updateTransaction, onClose]);

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
      {/* Header — type toggle pills + close */}
      <View className="flex-row items-center" style={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}>
        <View className="flex-1 flex-row items-center justify-center" style={{ gap: 8 }}>
          <Pressable
            onPress={() => toggleType('expense')}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999,
              backgroundColor: type === 'expense' ? '#E57373' : undefined,
              shadowColor: type === 'expense' ? '#E57373' : 'transparent',
              shadowOpacity: type === 'expense' ? 0.3 : 0,
              shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
            }}
            className={type === 'expense' ? '' : 'bg-card'}
          >
            <Text style={{
              fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14,
              color: type === 'expense' ? '#fff' : '#A39685',
            }}>⊖ รายจ่าย</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleType('income')}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999,
              backgroundColor: type === 'income' ? '#5CB88A' : undefined,
              shadowColor: type === 'income' ? '#5CB88A' : 'transparent',
              shadowOpacity: type === 'income' ? 0.3 : 0,
              shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
            }}
            className={type === 'income' ? '' : 'bg-card'}
          >
            <Text style={{
              fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14,
              color: type === 'income' ? '#fff' : '#A39685',
            }}>⊕ รายรับ</Text>
          </Pressable>
        </View>
        <Pressable onPress={onClose} style={{ padding: 4 }}>
          <Ionicons name="close" size={22} color="#6B5F52" />
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
            type={type}
            walletId={selectedWallet?.id ?? null}
            selectedAmount={amount}
            onRecommendSelect={({ category, amount, note }) => {
              setSelectedCategory(category);
              setAmount(amount);
              if (note) setNote(note);
            }}
            onTabChange={setCategoryTab}
          />

          {/* Date + Wallet + Note + Calculator — hidden in manage tab */}
          {categoryTab !== 'manage' && (<>
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center py-1.5 px-3 bg-secondary rounded-full mr-2"
            >
              <Ionicons name="calendar-outline" size={18} color="#6B5F52" />
              <Text className="text-foreground text-base ml-1">
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
                <View style={{ backgroundColor: 'white', paddingBottom: 24, }}>
                  <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text className="text-muted-foreground font-medium text-base">ยกเลิก</Text>
                    </Pressable>
                    <Text className="text-foreground font-semibold text-base">เลือกวันที่</Text>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text className="text-primary font-semibold text-base">ตกลง</Text>
                    </Pressable>
                  </View>
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      locale="th-TH"
                      themeVariant="light"
                      textColor="#000000"
                      style={{ alignSelf: 'center' }}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Note + Amount */}
          <View className="flex-row items-center mb-2" style={{ gap: 10 }}>
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="บันทึก..."
              placeholderTextColor="#999"
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setTimeout(() => setNoteFocused(false), 150)}
              style={{
                flex: 1, paddingVertical: 10, paddingHorizontal: 14,
                borderWidth: 1, borderColor: '#EDE4D3', borderRadius: 14,
                fontSize: 14, color: '#2B2118',
                fontFamily: 'IBMPlexSansThai_400Regular',
              }}
            />
            <Text style={{
              fontFamily: 'Inter_900Black', fontSize: 20,
              fontVariant: ['tabular-nums'],
              minWidth: 70, textAlign: 'right',
              color: type === 'income' ? '#5CB88A' : '#E57373',
            }}>
              ฿{amount > 0 ? amount.toLocaleString('th-TH') : '0'}
            </Text>
          </View>

          {/* Past notes list — horizontal scroll, visible only when note input is focused */}
          {noteFocused && pastNotes.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-2"
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row gap-1.5">
                {pastNotes
                  .filter(n => !note || n.toLowerCase().includes(note.toLowerCase()))
                  .map(n => (
                    <Pressable
                      key={n}
                      onPress={() => {
                        setNote(n);
                        setNoteFocused(false);
                        Haptics.selectionAsync();
                      }}
                      className="flex-row items-center px-3 py-1.5 rounded-full border border-border bg-secondary"
                    >
                      <Ionicons name="time-outline" size={12} color="#A39685" />
                      <Text className="text-foreground text-xs ml-1" numberOfLines={1}>
                        {n}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </ScrollView>
          )}

          {/* Calculator Keypad + Save Button */}
          </>)}
          {categoryTab !== 'manage' && (
            <CalculatorPad
              value={amount}
              onChange={setAmount}
              type={type}
              onSave={handleSave}
              saveLabel={isEditMode ? 'อัพเดท' : 'บันทึก'}
              saveDisabled={!amount || !selectedCategory}
            />
          )}
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
