import { CalculatorPad } from '@/components/common/CalculatorPad';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getDistinctNotesByCategory, getTopAnalysesByWallet, getTopCategoryIdsByWallet } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { formatCurrency } from '@/lib/utils/format';
import type { Analysis, Category, Transaction, TransactionType, Wallet } from '@/types';
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
import { CategoryGridModal } from './CategoryGridModal';
import { CategorySettingsModal } from './CategorySettingsModal';

interface TransactionFormProps {
  editTransaction?: Transaction | null;
  onClose: () => void;
}

/** Fixed column width for category quick rows (icon + label); label truncates with … */
const CATEGORY_QUICK_ITEM_WIDTH = 66;

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
  const [showGridModal, setShowGridModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [topCategoryIds, setTopCategoryIds] = useState<string[]>([]);
  const [topAnalyses, setTopAnalyses] = useState<Analysis[]>([]);

  const isEditMode = !!(editTransaction && editTransaction.id);

  const categories = useCategoryStore(s => s.categories);
  const wallets = useWalletStore(s => s.wallets);
  const defaultWalletId = useSettingsStore(s => s.defaultWalletId);
  const recTxColumns = useSettingsStore(s => s.recTxColumns);
  const recTxRows = useSettingsStore(s => s.recTxRows);
  const showCommonCategories = useSettingsStore(s => s.showCommonCategories);
  const showTopCategories = useSettingsStore(s => s.showTopCategories);
  const commonCategoryLimit = useSettingsStore(s => s.commonCategoryLimit);
  const topCategoryLimit = useSettingsStore(s => s.topCategoryLimit);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const updateTransaction = useTransactionStore(s => s.updateTransaction);

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === type),
    [categories, type]
  );

  const recCatLimit = Math.min(20, Math.max(3, topCategoryLimit || 8));
  const recTxLimit = Math.min(4, Math.max(1, recTxColumns || 2)) * Math.min(4, Math.max(1, recTxRows || 2));

  // Pre-fill when editing
  useEffect(() => {
    if (!editTransaction) return;
    setType(editTransaction.type);
    setAmount(editTransaction.amount);
    setSelectedCategory(editTransaction.category ?? categories.find(c => c.id === editTransaction.categoryId) ?? null);
    setSelectedWallet(wallets.find(w => w.id === editTransaction.walletId) ?? null);
    setDate(editTransaction.date ? new Date(editTransaction.date) : new Date());
    setNote(editTransaction.note ?? '');
  }, [editTransaction, wallets, categories]);

  // Load past notes
  useEffect(() => {
    if (!selectedCategory) { setPastNotes([]); return; }
    getDistinctNotesByCategory(getDb(), selectedCategory.id).then(setPastNotes);
  }, [selectedCategory]);

  // Default wallet
  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      const preferred = wallets.find(w => w.id === selectedWalletId) ?? wallets.find(w => w.id === defaultWalletId) ?? wallets[0];
      setSelectedWallet(preferred);
    }
  }, [wallets, selectedWallet, selectedWalletId, defaultWalletId]);

  // Load top categories + analyses for quick row & frequent pills
  useEffect(() => {
    const wId = selectedWallet?.id;
    if (!wId) { setTopCategoryIds([]); setTopAnalyses([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const db = getDb();
        const [cats, ans] = await Promise.all([
          getTopCategoryIdsByWallet(db, wId, type, recCatLimit),
          getTopAnalysesByWallet(db, wId, type, recTxLimit),
        ]);
        if (cancelled) return;
        setTopCategoryIds(cats.map(c => c.categoryId));
        setTopAnalyses(ans);
      } catch {
        if (!cancelled) { setTopCategoryIds([]); setTopAnalyses([]); }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedWallet?.id, type, categories.length, recCatLimit, recTxLimit]);

  const commonCategories = useMemo(
    () => categories.filter(c => c.type === type && c.isCustom === false).slice(0, commonCategoryLimit),
    [categories, type, commonCategoryLimit]
  );

  const topCategories = useMemo(
    () => topCategoryIds.map(id => categories.find(c => c.id === id)).filter((c): c is Category => !!c),
    [topCategoryIds, categories]
  );

  const handleSave = useCallback(async () => {
    if (!amount || !selectedCategory) return;
    const walletId = selectedWallet?.id ?? defaultWalletId;
    if (isEditMode && editTransaction) {
      await updateTransaction(editTransaction.id, { type, amount, categoryId: selectedCategory.id, walletId, note: note.trim() || undefined, date: date.toISOString().split('T')[0] });
    } else {
      await addTransaction({ type, amount, categoryId: selectedCategory.id, walletId, note: note.trim() || undefined, date: date.toISOString().split('T')[0] });
    }
    onClose();
  }, [amount, selectedCategory, selectedWallet, defaultWalletId, type, note, date, isEditMode, editTransaction, addTransaction, updateTransaction, onClose]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) setDate(selectedDate);
      return;
    }
    if (selectedDate) setDate(selectedDate);
  };

  const toggleType = (newType: TransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    Haptics.selectionAsync();
  };

  const handleFrequentPill = (a: Analysis) => {
    const cat = categories.find(c => c.id === a.categoryId);
    if (!cat) return;
    Haptics.selectionAsync();
    setSelectedCategory(cat);
    setAmount(a.amount);
    if (a.note) setNote(a.note);
  };

  const amountColor = type === 'expense' ? '#C65A4E' : '#3E8B68';

  return (
    <View className="flex-1 bg-background">
      {/* Header: settings (left) + pill toggle (center) + close (right) */}
      <View className="flex-row items-center" style={{ paddingHorizontal: 14, paddingBottom: 1, gap: 8 }}>
        <Pressable
          onPress={() => setShowSettingsModal(true)}
          style={{ width: 82, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          className="bg-secondary"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 3}}>
            <Ionicons name="options-outline" size={18} color="#9A8D80" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 , color: '#9A8D80'}} className="text-foreground">ตั้งค่า</Text>
          </View>
        </Pressable>

        <View className="flex-1 flex-row bg-secondary rounded-full" style={{ padding: 3 }}>
          {[{ k: 'expense' as const, l: 'รายจ่าย' }, { k: 'income' as const, l: 'รายรับ' }].map(t => (
            <Pressable
              key={t.k}
              onPress={() => toggleType(t.k)}
              className="flex-1 items-center rounded-full"
              style={{
                paddingVertical: 7,
                backgroundColor: type === t.k ? (t.k === 'expense' ? '#C65A4E' : '#3E8B68') : 'transparent',
              }}
            >
              <Text style={{
                fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14,
                color: type === t.k ? '#fff' : '#9A8D80',
              }}>{t.l}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onClose}
          style={{ width: 62, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          className="bg-secondary"
        >
          <Ionicons name="close" size={16} color="#9A8D80" />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount display — centered large */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontFamily: 'Inter_900Black', fontSize: 48,
              fontVariant: ['tabular-nums'], letterSpacing: -0.8,
              color: amountColor, lineHeight: 40, paddingTop: 24,
            }}>
              {type === 'expense' ? '−' : '+'}{amount > 0 ? amount.toLocaleString('en-US') : '0'}
              <Text style={{ fontSize: 18, fontFamily: 'Inter_400Regular', color: '#9A8D80', marginLeft: 6 }}> ฿</Text>
            </Text>
          </View>

          {/* Category quick row ที่มีอยู่ในกระเป๋า*/}
          {showCommonCategories && (
            <View style={{ paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 1, gap: 4, justifyContent: 'space-between' }}>
                {commonCategories.map((cat) => {
                  const sel = cat.id === selectedCategory?.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); }}
                      style={{ width: CATEGORY_QUICK_ITEM_WIDTH, alignItems: 'center', gap: 1 }}
                    >
                      <View style={{
                        padding: sel ? 2 : 0, borderRadius: 999,
                        borderWidth: 2, borderColor: sel ? '#E87A3D' : 'transparent',
                      }}>
                        <View
                          className="rounded-full items-center justify-center"
                          style={{ width: 46, height: 46, backgroundColor: cat.color }}
                        >
                          <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={20} color="white" />
                        </View>
                      </View>
                      <Text
                        style={{
                          width: CATEGORY_QUICK_ITEM_WIDTH,
                          textAlign: 'center',
                          fontFamily: sel ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                          fontSize: 11, color: sel ? '#2A2320' : '#9A8D80',
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* เลือกเพิ่ม */}
                <Pressable
                  onPress={() => setShowGridModal(true)}
                  style={{ width: CATEGORY_QUICK_ITEM_WIDTH, alignItems: 'center', gap: 4, padding: 2 }}
                >
                  <View style={{
                    width: 46, height: 46, borderRadius: 23,
                    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E87A3D',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="add" size={18} color="#E87A3D" />
                  </View>
                  <Text
                    style={{
                      width: CATEGORY_QUICK_ITEM_WIDTH,
                      textAlign: 'center',
                      fontFamily: 'IBMPlexSansThai_600SemiBold',
                      fontSize: 11,
                      color: '#E87A3D',
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    เลือกเพิ่ม
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Category quick row ที่ใช้มากที่สุด*/}
          {showTopCategories && (
            <View style={{ paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 1, gap: 4, justifyContent: 'space-between' }}>
                {topCategories.map((cat) => {
                  const sel = cat.id === selectedCategory?.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); }}
                      style={{ width: CATEGORY_QUICK_ITEM_WIDTH, alignItems: 'center', gap: 1 }}
                    >
                      <View style={{
                        padding: sel ? 2 : 0, borderRadius: 999,
                        borderWidth: 2, borderColor: sel ? '#E87A3D' : 'transparent',
                      }}>
                        <View
                          className="rounded-full items-center justify-center"
                          style={{ width: 46, height: 46, backgroundColor: cat.color }}
                        >
                          <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={20} color="white" />
                        </View>
                      </View>
                      <Text
                        style={{
                          width: CATEGORY_QUICK_ITEM_WIDTH,
                          textAlign: 'center',
                          fontFamily: sel ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                          fontSize: 11, color: sel ? '#2A2320' : '#9A8D80',
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* เลือกเพิ่ม */}
                <Pressable
                  onPress={() => setShowGridModal(true)}
                  style={{ width: CATEGORY_QUICK_ITEM_WIDTH, alignItems: 'center', gap: 4, padding: 2 }}
                >
                  <View style={{
                    width: 46, height: 46, borderRadius: 23,
                    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E87A3D',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="add" size={18} color="#E87A3D" />
                  </View>
                  <Text
                    style={{
                      width: CATEGORY_QUICK_ITEM_WIDTH,
                      textAlign: 'center',
                      fontFamily: 'IBMPlexSansThai_600SemiBold',
                      fontSize: 11,
                      color: '#E87A3D',
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    เลือกเพิ่ม
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Frequent pills */}
          {topAnalyses.length > 0 && (
            <View style={{ paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }} className="text-muted-foreground">
                  รายการที่ใช้บ่อย
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {topAnalyses.map((a) => {
                  const cat = categories.find(c => c.id === a.categoryId);
                  if (!cat) return null;
                  const isActive = selectedCategory?.id === cat.id && amount === a.amount;
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => handleFrequentPill(a)}
                      style={{
                        flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingVertical: 3, paddingHorizontal: 12, paddingLeft: 6, borderRadius: 14,
                        borderWidth: isActive ? 1.5 : 1,
                        borderColor: isActive ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                        backgroundColor: isActive ? 'rgba(232,122,61,0.08)' : undefined,
                        shadowColor: '#2A2320', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
                      }}
                      className={isActive ? '' : 'bg-card'}
                    >
                      {/* <View className="rounded-full items-center justify-center" style={{ width: 26, height: 26, backgroundColor: cat.color }}>
                        <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={12} color="white" />
                      </View> */}
                      <View>
                        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: '#2A2320', maxWidth: 90, textAlign: 'center' }} numberOfLines={1}>
                          {a.note || cat.name}
                        </Text>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12.5, fontVariant: ['tabular-nums'], color: '#C65A4E', marginTop: 1, textAlign: 'center' }}>
                          {formatCurrency(a.amount)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Date + Wallet chips */}
          <View className="flex-row items-center mb-2" style={{ gap: 8, overflow: 'hidden' }}>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4, flexShrink: 0 }}
            >
              <Ionicons name="calendar-outline" size={16} color="#2A2320" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14, fontVariant: ['tabular-nums'] }} className="text-foreground">
                {date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              </Text>
            </Pressable>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
              <View className="flex-row" style={{ gap: 6 }}>
                {wallets.map(w => {
                  const isSelected = w.id === selectedWallet?.id;
                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => { Haptics.selectionAsync(); setSelectedWallet(w); }}
                      style={{
                        height: 30, paddingHorizontal: 12, borderRadius: 999, flexShrink: 0,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        borderWidth: isSelected ? 1.5 : 1,
                        borderColor: isSelected ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                      }}
                    >
                      <View className="rounded-full items-center justify-center" style={{ width: 16, height: 16, backgroundColor: w.color }}>
                        <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={8} color="white" />
                      </View>
                      <Text style={{
                        fontFamily: isSelected ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                        fontSize: 13, color: isSelected ? '#E87A3D' : '#2A2320',
                      }}>{w.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Date picker modals */}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
          )}
          {Platform.OS === 'ios' && (
            <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
              <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowDatePicker(false)} />
                <View style={{ backgroundColor: 'white', paddingBottom: 24 }}>
                  <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 16 }} className="text-muted-foreground">ยกเลิก</Text>
                    </Pressable>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 16 }} className="text-foreground">เลือกวันที่</Text>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 16 }} className="text-primary">ตกลง</Text>
                    </Pressable>
                  </View>
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <DateTimePicker value={date} mode="date" display="spinner" onChange={handleDateChange} locale="th-TH" themeVariant="light" textColor="#000000" style={{ alignSelf: 'center' }} />
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Note input + inline amount */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            borderRadius: 14, borderWidth: 1, borderColor: 'rgba(42,35,32,0.08)',
            padding: 10, paddingHorizontal: 14, marginBottom: 8,
            shadowColor: '#2A2320', shadowOpacity: 0.03, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
          }} className="bg-card">
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="บันทึก..."
              placeholderTextColor="#9A8D80"
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setTimeout(() => setNoteFocused(false), 150)}
              style={{ flex: 1, fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 15, color: '#2A2320' }}
            />
            <Text style={{
              fontFamily: 'Inter_900Black', fontSize: 22,
              fontVariant: ['tabular-nums'], letterSpacing: -0.3, color: amountColor,
            }}>
              ฿{amount > 0 ? amount.toLocaleString('en-US') : '0'}
            </Text>
          </View>

          {/* Past notes */}
          {noteFocused && pastNotes.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2" keyboardShouldPersistTaps="handled">
              <View className="flex-row" style={{ gap: 6 }}>
                {pastNotes
                  .filter(n => !note || n.toLowerCase().includes(note.toLowerCase()))
                  .map(n => (
                    <Pressable
                      key={n}
                      onPress={() => { setNote(n); setNoteFocused(false); Haptics.selectionAsync(); }}
                      className="flex-row items-center px-3 py-1.5 rounded-full border border-border bg-secondary"
                    >
                      <Ionicons name="time-outline" size={12} color="#9A8D80" />
                      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-foreground ml-1" numberOfLines={1}>{n}</Text>
                    </Pressable>
                  ))}
              </View>
            </ScrollView>
          )}

          {/* Calculator */}
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

      {/* Modals */}
      <CategoryGridModal
        visible={showGridModal}
        categories={filteredCategories}
        selectedId={selectedCategory?.id}
        onSelect={setSelectedCategory}
        onClose={() => setShowGridModal(false)}
      />
      <CategorySettingsModal
        visible={showSettingsModal}
        type={type}
        categories={filteredCategories}
        onClose={() => setShowSettingsModal(false)}
      />
    </View>
  );
}
