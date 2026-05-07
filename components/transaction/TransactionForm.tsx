import { CalculatorPad } from '@/components/common/CalculatorPad';
import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { PawPrintIcon } from '@/components/common/PawPrintIcon';
import { WalletPickerPopover } from '@/components/wallet/WalletPickerPopover';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getDistinctNotesByCategory, getFrequentAmountsByWallet, getTopCategoryIdsByWallet } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { formatCurrency, toLocalDateISO } from '@/lib/utils/format';
import type { Analysis, Category, Transaction, TransactionType, Wallet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [showPastNotes, setShowPastNotes] = useState(false);
  const [pastNotes, setPastNotes] = useState<string[]>([]);
  const [showGridModal, setShowGridModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [topCategoryIds, setTopCategoryIds] = useState<string[]>([]);
  const [topAnalyses, setTopAnalyses] = useState<Analysis[]>([]);
  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false);
  const [walletAnchor, setWalletAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const walletTriggerRef = useRef<View>(null);

  const isEditMode = !!(editTransaction && editTransaction.id);
  const insets = useSafeAreaInsets();

  const categories = useCategoryStore(s => s.categories);
  const wallets = useWalletStore(s => s.wallets);
  const defaultWalletId = useSettingsStore(s => s.defaultWalletId);
  const recTxColumns = useSettingsStore(s => s.recTxColumns);
  const recTxRows = useSettingsStore(s => s.recTxRows);
  const showCommonCategories = useSettingsStore(s => s.showCommonCategories);
  const showTopCategories = useSettingsStore(s => s.showTopCategories);
  const showFrequentPills = useSettingsStore(s => s.showFrequentPills);
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

  // Auto-select first category only for fresh adds — skip when populating from edit/copy
  useEffect(() => {
    if (editTransaction) return;
    if (!selectedCategory && filteredCategories.length > 0) {
      setSelectedCategory(filteredCategories[0]);
    }
  }, [editTransaction, filteredCategories, selectedCategory]);

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

  // Load top categories for quick row
  useEffect(() => {
    const wId = selectedWallet?.id;
    if (!wId) { setTopCategoryIds([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const db = getDb();
        const cats = await getTopCategoryIdsByWallet(db, wId, type, recCatLimit);
        if (cancelled) return;
        setTopCategoryIds(cats.map(c => c.categoryId));
      } catch {
        if (!cancelled) setTopCategoryIds([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedWallet?.id, type, categories.length, recCatLimit]);

  // Load frequent amounts — grouped by `amount` only (optionally within selected category)
  useEffect(() => {
    const wId = selectedWallet?.id;
    if (!wId) { setTopAnalyses([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const db = getDb();
        const ans = await getFrequentAmountsByWallet(
          db, wId, type, recTxLimit, selectedCategory?.id
        );
        if (cancelled) return;
        setTopAnalyses(ans);
      } catch {
        if (!cancelled) setTopAnalyses([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedWallet?.id, type, recTxLimit, selectedCategory?.id]);

  const commonCategories = useMemo(
    () => categories.filter(c => c.type === type).slice(0, commonCategoryLimit),
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
      await updateTransaction(editTransaction.id, { type, amount, categoryId: selectedCategory.id, walletId, note: note.trim() || undefined, date: toLocalDateISO(date) });
    } else {
      await addTransaction({ type, amount, categoryId: selectedCategory.id, walletId, note: note.trim() || undefined, date: toLocalDateISO(date) });
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

  const [calcExpression, setCalcExpression] = useState('');
  const [calcHasOperator, setCalcHasOperator] = useState(false);

  const handleExpressionChange = useCallback((expr: string, hasOp: boolean) => {
    setCalcExpression(expr);
    setCalcHasOperator(hasOp);
  }, []);

  const amountColor = type === 'expense' ? '#C65A4E' : '#3E8B68';

  return (
    <View className="flex-1 bg-background">
      {/* Header: settings (left) + pill toggle (center) + close (right) */}
      <View className="flex-row items-center" style={{ paddingHorizontal: 14, paddingBottom: 1, gap: 8 }}>
        <Pressable
          onPress={() => setShowSettingsModal(true)}
          style={{ width: 82, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          className="bg-secondary"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 3 }}>
            <Ionicons name="options-outline" size={18} color="#9A8D80" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: '#9A8D80' }} className="text-foreground">ตั้งค่า</Text>
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
          style={{ width: 62, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          className="bg-secondary"
        >
          <Ionicons name="close" size={16} color="#9A8D80" />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, paddingHorizontal: 14 }}>
        {/* Amount display + selected category — fixed */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 6, paddingBottom: 8, justifyContent: 'center', position: 'relative' }}>
          {/* Selected category at far left */}
          <View style={{ position: 'absolute', left: 0, justifyContent: 'center', height: '100%', minWidth: 60, alignItems: 'flex-start' }}>
            {selectedCategory && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CatCategoryIcon kind={selectedCategory.icon} bg={selectedCategory.color} size={22} />
                <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}>
                  {selectedCategory.name}
                </Text>
              </View>
            )}
          </View>
          {/* Amount display centered */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {calcHasOperator && calcExpression ? (
              <Text style={{
                fontFamily: 'Inter_700Bold', fontSize: 16,
                fontVariant: ['tabular-nums'], color: '#9A8D80',
                marginBottom: 8,
              }}>
                {calcExpression}
              </Text>
            ) : null}
            <Text style={{
              fontFamily: 'Inter_900Black', fontSize: 48,
              fontVariant: ['tabular-nums'], letterSpacing: -0.8,
              color: amountColor, lineHeight: 48,
            }}>
              {type === 'expense' ? '−' : '+'}{amount > 0 ? amount.toLocaleString('en-US') : '0'}
              <Text style={{ fontSize: 18, fontFamily: 'Inter_400Regular', color: '#9A8D80', marginLeft: 6 }}> ฿</Text>
            </Text>
          </View>
        </View>


        {/* Category rows — scrollable, fills remaining space */}
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          {/* Category quick row ที่มีอยู่ในกระเป๋า*/}
          {showCommonCategories && (
            <View style={{ paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 1, gap: 4, justifyContent: 'space-between' }}>
                {commonCategories.map((cat) => {
                  const sel = cat.id === selectedCategory?.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); setNote(''); setShowPastNotes(true); }}
                      style={{ width: CATEGORY_QUICK_ITEM_WIDTH, alignItems: 'center', gap: 1 }}
                    >
                      <View style={{
                        padding: sel ? 2 : 0, borderRadius: 999,
                        borderWidth: 4, borderColor: sel ? '#E87A3D' : 'transparent',
                      }}>
                        <CatCategoryIcon kind={cat.icon} bg={cat.color} size={46} />
                        {sel && (
                          <View
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              top: -5,
                              right: -18,
                              transform: [{ rotate: '-18deg' }],
                            }}
                          >
                            <PawPrintIcon size={22} color="#E87A3D" />
                          </View>
                        )}
                      </View>
                      <Text
                        className={sel ? 'text-foreground' : 'text-muted-foreground'}
                        style={{
                          width: CATEGORY_QUICK_ITEM_WIDTH,
                          textAlign: 'center',
                          fontFamily: sel ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                          fontSize: 11,
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
                      onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); setNote(''); setShowPastNotes(true); }}
                      style={{ width: CATEGORY_QUICK_ITEM_WIDTH, alignItems: 'center', gap: 1 }}
                    >
                      <View style={{
                        padding: sel ? 2 : 0, borderRadius: 999,
                        borderWidth: 2, borderColor: sel ? '#E87A3D' : 'transparent',
                      }}>
                        <CatCategoryIcon kind={cat.icon} bg={cat.color} size={46} />
                        {sel && (
                          <View
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              top: -5,
                              right: -15,
                              transform: [{ rotate: '-18deg' }],
                            }}
                          >
                            <PawPrintIcon size={22} color="#E87A3D" />
                          </View>
                        )}
                      </View>
                      <Text
                        className={sel ? 'text-foreground' : 'text-muted-foreground'}
                        style={{
                          width: CATEGORY_QUICK_ITEM_WIDTH,
                          textAlign: 'center',
                          fontFamily: sel ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                          fontSize: 11,
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
        </BottomSheetScrollView>

        {/* Bottom fixed section */}
        <View style={{ flexShrink: 0, paddingBottom: Math.max(6, insets.bottom) }}>
          {/* Frequent pills */}
          {showFrequentPills && topAnalyses.length > 0 && (
            <View style={{ paddingBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 8 }} className="text-muted-foreground">
                  {selectedCategory ? `รายการ ${selectedCategory.name} ที่ใช้บ่อย` : 'รายการที่ใช้บ่อย'}
                </Text>
              </View>
              <GHScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                directionalLockEnabled
                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 1 }}
              >
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
                        paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14,
                        borderWidth: isActive ? 1.5 : 1,
                        borderColor: isActive ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                        backgroundColor: isActive ? 'rgba(232,122,61,0.08)' : undefined,
                        shadowColor: '#2A2320', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
                      }}
                      className={isActive ? '' : 'bg-card'}
                    >
                      <View>
                        {/* รายการที่ใช้บ่อย เป็นชื่อหมวดหมู่ หรือ รายละเอียดรายการบันทึก */}
                        {/* <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: '#2A2320', maxWidth: 90, textAlign: 'center' }} numberOfLines={1}>
                          {a.note || cat.name}
                        </Text> */}
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, fontVariant: ['tabular-nums'], color: '#C65A4E', marginTop: 1, textAlign: 'center' }}>
                          {formatCurrency(a.amount)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </GHScrollView>
            </View>
          )}

          {/* Date + Wallet chips — fixed (50/50 split) */}
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 6, marginTop: 4 }}>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                flex: 1, minWidth: 0, height: 32, paddingHorizontal: 12,
                borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(42,35,32,0.03)',
              }}
            >
              <Ionicons name="calendar-outline" size={14} color="#A39685" />
              <Text
                className="text-foreground"
                style={{ flex: 1, fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, fontVariant: ['tabular-nums'] }}
                numberOfLines={1}
              >
                {date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#A39685" />
            </Pressable>

            <Pressable
              ref={walletTriggerRef}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                walletTriggerRef.current?.measureInWindow((x, y, width, height) => {
                  setWalletAnchor({ x, y, width, height });
                  setWalletPopoverOpen(true);
                });
              }}
              style={{
                flex: 1, minWidth: 0, height: 32, paddingHorizontal: 12,
                borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(232,122,61,0.06)',
              }}
            >
              {selectedWallet ? (
                <>
                  <View className="rounded-full items-center justify-center" style={{ width: 18, height: 18, backgroundColor: selectedWallet.color }}>
                    <Ionicons name={selectedWallet.icon as keyof typeof Ionicons.glyphMap} size={10} color="white" />
                  </View>
                  <Text
                    className="text-primary"
                    style={{ flex: 1, fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}
                    numberOfLines={1}
                  >{selectedWallet.name}</Text>
                </>
              ) : (
                <Text style={{ flex: 1, fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#A39685' }}>เลือกกระเป๋า</Text>
              )}
              <Ionicons name="chevron-down" size={14} color="#E87A3D" />
            </Pressable>
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

          {/* Note input + past notes — fixed */}
          <View
            style={{
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(42,35,32,0.08)',
              padding: 10,
              paddingHorizontal: 14,
              marginBottom: 4,
              shadowColor: '#2A2320',
              shadowOpacity: 0.03,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              gap: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            className="bg-card"
          >
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="บันทึก.."
              placeholderTextColor="#9A8D80"
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setTimeout(() => setNoteFocused(false), 150)}
              style={{
                flex: 1,
                fontFamily: 'IBMPlexSansThai_400Regular',
                fontSize: 15,
                color: '#2A2320',
                paddingVertical: 0,
                paddingRight: 6,
                maxHeight: 16,
                minWidth: 56,
              }}
            />
            {(noteFocused || showPastNotes) &&
              pastNotes.filter(n => !note || n.toLowerCase().includes(note.toLowerCase())).length > 0 && (
                <GHScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}
                  style={{ flexShrink: 1, flexGrow: 0, minHeight: 24, marginLeft: 2 }}
                >
                  {pastNotes
                    .filter(n => !note || n.toLowerCase().includes(note.toLowerCase()))
                    .map(n => (
                      <Pressable
                        key={n}
                        onPress={() => { setNote(n); setNoteFocused(false); setShowPastNotes(false); Haptics.selectionAsync(); }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 999,
                          backgroundColor: 'rgba(42,35,32,0.05)',
                          maxWidth: 120,
                        }}
                      >
                        <Ionicons name="time-outline" size={11} color="#9A8D80" />
                        <Text
                          style={{
                            fontFamily: 'IBMPlexSansThai_400Regular',
                            fontSize: 12,
                            color: '#2A2320',
                            maxWidth: 90,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {n}
                        </Text>
                      </Pressable>
                    ))}
                </GHScrollView>
              )
            }
          </View>

          {/* Calculator */}
          <CalculatorPad
            value={amount}
            onChange={setAmount}
            type={type}
            onSave={handleSave}
            saveLabel={isEditMode ? 'อัพเดท' : 'บันทึก'}
            saveDisabled={!amount || !selectedCategory}
            onExpressionChange={handleExpressionChange}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <CategoryGridModal
        visible={showGridModal}
        categories={filteredCategories}
        selectedId={selectedCategory?.id}
        type={type}
        onSelect={setSelectedCategory}
        onClose={() => setShowGridModal(false)}
      />
      <CategorySettingsModal
        visible={showSettingsModal}
        type={type}
        categories={filteredCategories}
        onClose={() => setShowSettingsModal(false)}
      />
      <WalletPickerPopover
        visible={walletPopoverOpen}
        anchor={walletAnchor}
        selectedWalletId={selectedWallet?.id ?? null}
        onSelect={(id) => {
          const w = wallets.find(x => x.id === id);
          if (w) setSelectedWallet(w);
        }}
        onClose={() => setWalletPopoverOpen(false)}
      />
    </View>
  );
}
