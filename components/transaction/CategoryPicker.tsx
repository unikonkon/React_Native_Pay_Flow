import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getTopAnalysesByWallet, getTopCategoryIdsByWallet } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import type { Analysis, Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { AddCategoryModal } from './AddCategoryModal';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
  type: TransactionType;
  walletId?: string | null;
  selectedAmount?: number;
  onRecommendSelect?: (data: { category: Category; amount: number; note?: string }) => void;
  onTabChange?: (tab: 'recommend' | 'select' | 'manage') => void;
}

type Tab = 'recommend' | 'select' | 'manage';

// Per-item height: icon 56 + mt-1 (4) + text (~16) + mb-2 (8) = 84
const ITEM_HEIGHT = 94;
const MIN_COLS = 3;
const MAX_COLS = 8;
const MIN_ROWS = 2;
const MAX_ROWS = 6;
const REC_CAT_MIN_COLS = 3;
const REC_CAT_MAX_COLS = 8;
const REC_CAT_MIN_ROWS = 1;
const REC_CAT_MAX_ROWS = 3;
const REC_TX_MIN_COLS = 1;
const REC_TX_MAX_COLS = 4;
const REC_TX_MIN_ROWS = 1;
const REC_TX_MAX_ROWS = 4;

interface StepperRowProps {
  label: string;
  cols: number; rows: number;
  colMin: number; colMax: number;
  rowMin: number; rowMax: number;
  onCol: (delta: number) => void;
  onRow: (delta: number) => void;
}

function StepperRow({ label, cols, rows, colMin, colMax, rowMin, rowMax, onCol, onRow }: StepperRowProps) {
  const btn = 'w-8 h-8 rounded-full items-center justify-center bg-card border border-border';
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-foreground text-xs font-semibold flex-1" numberOfLines={1}>{label}</Text>
      <View className="flex-row items-center mr-3">
        <Text className="text-muted-foreground text-[10px] mr-1.5">คอลัมน์</Text>
        <Pressable onPress={() => onCol(-1)} disabled={cols <= colMin} className={`${btn} ${cols <= colMin ? 'opacity-40' : ''}`}>
          <Ionicons name="remove" size={12} color="#6B5F52" />
        </Pressable>
        <Text className="text-foreground text-xs font-bold mx-1.5 w-4 text-center">{cols}</Text>
        <Pressable onPress={() => onCol(1)} disabled={cols >= colMax} className={`${btn} ${cols >= colMax ? 'opacity-40' : ''}`}>
          <Ionicons name="add" size={12} color="#6B5F52" />
        </Pressable>
      </View>
      <View className="flex-row items-center ml-3">
        <Text className="text-muted-foreground text-[10px] mr-1.5">แถว</Text>
        <Pressable onPress={() => onRow(-1)} disabled={rows <= rowMin} className={`${btn} ${rows <= rowMin ? 'opacity-40' : ''}`}>
          <Ionicons name="remove" size={12} color="#6B5F52" />
        </Pressable>
        <Text className="text-foreground text-xs font-bold mx-1.5 w-4 text-center">{rows}</Text>
        <Pressable onPress={() => onRow(1)} disabled={rows >= rowMax} className={`${btn} ${rows >= rowMax ? 'opacity-40' : ''}`}>
          <Ionicons name="add" size={12} color="#6B5F52" />
        </Pressable>
      </View>
    </View>
  );
}

export function CategoryPicker({ categories, selectedId, onSelect, type, walletId, selectedAmount, onRecommendSelect, onTabChange }: CategoryPickerProps) {
  const {
    categoryColumns, categoryRows,
    recCategoryColumns, recCategoryRows,
    recTxColumns, recTxRows,
    defaultCategoryTab,
    updateSettings,
  } = useSettingsStore();

  const [tab, setTab] = useState<Tab>(defaultCategoryTab === 'recommend' ? 'recommend' : 'select');
  const [addVisible, setAddVisible] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [topCategoryIds, setTopCategoryIds] = useState<string[]>([]);
  const [topAnalyses, setTopAnalyses] = useState<Analysis[]>([]);

  const deleteCategory = useCategoryStore(s => s.deleteCategory);
  const reorderCategories = useCategoryStore(s => s.reorderCategories);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const columns = Math.min(MAX_COLS, Math.max(MIN_COLS, categoryColumns || 6));
  const rows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, categoryRows || 3));
  const recCatCols = Math.min(REC_CAT_MAX_COLS, Math.max(REC_CAT_MIN_COLS, recCategoryColumns || 6));
  const recCatRows = Math.min(REC_CAT_MAX_ROWS, Math.max(REC_CAT_MIN_ROWS, recCategoryRows || 1));
  const recTxCols = Math.min(REC_TX_MAX_COLS, Math.max(REC_TX_MIN_COLS, recTxColumns || 2));
  const recTxRowsN = Math.min(REC_TX_MAX_ROWS, Math.max(REC_TX_MIN_ROWS, recTxRows || 2));
  const recCatLimit = recCatCols * recCatRows;
  const recTxLimit = recTxCols * recTxRowsN;

  const selectedCat = categories.find(c => c.id === selectedId);

  const blockSheetPan = useMemo(
    () => Gesture.Native().shouldCancelWhenOutside(false),
    []
  );

  const adjustColumns = (delta: number) => {
    const next = Math.min(MAX_COLS, Math.max(MIN_COLS, columns + delta));
    if (next !== columns) {
      Haptics.selectionAsync();
      updateSettings({ categoryColumns: next });
    }
  };

  const adjustRows = (delta: number) => {
    const next = Math.min(MAX_ROWS, Math.max(MIN_ROWS, rows + delta));
    if (next !== rows) {
      Haptics.selectionAsync();
      updateSettings({ categoryRows: next });
    }
  };

  const adjustRecCatCols = (delta: number) => {
    const next = Math.min(REC_CAT_MAX_COLS, Math.max(REC_CAT_MIN_COLS, recCatCols + delta));
    if (next !== recCatCols) {
      Haptics.selectionAsync();
      updateSettings({ recCategoryColumns: next });
    }
  };
  const adjustRecCatRows = (delta: number) => {
    const next = Math.min(REC_CAT_MAX_ROWS, Math.max(REC_CAT_MIN_ROWS, recCatRows + delta));
    if (next !== recCatRows) {
      Haptics.selectionAsync();
      updateSettings({ recCategoryRows: next });
    }
  };
  const adjustRecTxCols = (delta: number) => {
    const next = Math.min(REC_TX_MAX_COLS, Math.max(REC_TX_MIN_COLS, recTxCols + delta));
    if (next !== recTxCols) {
      Haptics.selectionAsync();
      updateSettings({ recTxColumns: next });
    }
  };
  const adjustRecTxRows = (delta: number) => {
    const next = Math.min(REC_TX_MAX_ROWS, Math.max(REC_TX_MIN_ROWS, recTxRowsN + delta));
    if (next !== recTxRowsN) {
      Haptics.selectionAsync();
      updateSettings({ recTxRows: next });
    }
  };

  const pickUp = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPickedId(id);
  };

  const handleManageTap = (cat: Category) => {
    if (!pickedId) return;
    if (pickedId === cat.id) {
      Haptics.selectionAsync();
      setPickedId(null);
      return;
    }
    const ids = categories.map(c => c.id);
    const from = ids.indexOf(pickedId);
    const to = ids.indexOf(cat.id);
    if (from < 0 || to < 0) {
      setPickedId(null);
      return;
    }
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reorderCategories(type, ids);
    setPickedId(null);
  };

  useEffect(() => {
    if (tab !== 'recommend' || !walletId) {
      setTopCategoryIds([]);
      setTopAnalyses([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const db = getDb();
        const [cats, ans] = await Promise.all([
          getTopCategoryIdsByWallet(db, walletId, type, recCatLimit),
          getTopAnalysesByWallet(db, walletId, type, recTxLimit),
        ]);
        if (cancelled) return;
        setTopCategoryIds(cats.map(c => c.categoryId));
        setTopAnalyses(ans);
      } catch {
        if (!cancelled) {
          setTopCategoryIds([]);
          setTopAnalyses([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, walletId, type, categories.length, recCatLimit, recTxLimit]);

  const topCategories = useMemo(
    () => topCategoryIds
      .map(id => categories.find(c => c.id === id))
      .filter((c): c is Category => !!c),
    [topCategoryIds, categories]
  );

  const handleRecommendTx = (a: Analysis) => {
    const cat = categories.find(c => c.id === a.categoryId);
    if (!cat) return;
    Haptics.selectionAsync();
    if (onRecommendSelect) {
      onRecommendSelect({ category: cat, amount: a.amount, note: a.note });
    } else {
      onSelect(cat);
    }
  };

  const handleDelete = (cat: Category) => {
    if (!cat.isCustom) return;
    Alert.alert(
      'ลบหมวดหมู่',
      `ต้องการลบ "${cat.name}" ?\nรายการที่ใช้หมวดนี้ในทุกกระเป๋าจะถูกลบทั้งหมด`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id);
            await loadTransactions();
            await loadAnalysis();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-semibold">
          {tab === 'select' ? 'เลือกหมวดหมู่' : tab === 'manage' ? 'ตั้งค่าหมวดหมู่' : 'รายการที่ใช้บ่อย'}
        </Text>
        {tab === 'select' && selectedCat && (
          <View className="flex-row items-center px-3 py-1 rounded-full bg-primary/10 border border-primary">
            <View
              className="w-5 h-5 rounded-full items-center justify-center mr-1.5"
              style={{ backgroundColor: selectedCat.color }}
            >
              <Ionicons name={selectedCat.icon as keyof typeof Ionicons.glyphMap} size={12} color="white" />
            </View>
            <Text className="text-primary text-xs font-semibold">{selectedCat.name}</Text>
          </View>
        )}
      </View>

      <View className="flex-row bg-secondary rounded-2xl p-1 mb-2">
        <Pressable
          onPress={() => { setTab('recommend'); onTabChange?.('recommend'); }}
          className={`flex-1 py-1.5 rounded-xl items-center ${tab === 'recommend' ? 'bg-primary' : ''}`}
        >
          <Text className={`text-xs font-semibold ${tab === 'recommend' ? 'text-primary-foreground' : 'text-foreground'}`}>
            แนะนำ
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setTab('select'); onTabChange?.('select'); }}
          className={`flex-1 py-1.5 rounded-xl items-center ${tab === 'select' ? 'bg-primary' : ''}`}
        >
          <Text className={`text-xs font-semibold ${tab === 'select' ? 'text-primary-foreground' : 'text-foreground'}`}>
            เลือก
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setTab('manage'); onTabChange?.('manage'); }}
          className={`flex-1 py-1.5 rounded-xl items-center ${tab === 'manage' ? 'bg-primary' : ''}`}
        >
          <Text className={`text-xs font-semibold ${tab === 'manage' ? 'text-primary-foreground' : 'text-foreground'}`}>
            ตั้งค่า
          </Text>
        </Pressable>
      </View>

      {tab === 'manage' && (
        pickedId ? (
          <View className="flex-row items-center justify-center mb-2 px-2 py-2 bg-secondary/50 rounded-2xl">
            <Ionicons name="move" size={14} color="#E87A3D" />
            <Text className="text-primary text-xs font-semibold ml-1 flex-shrink" numberOfLines={1}>
              แตะปลายทางเพื่อวาง · แตะเดิมเพื่อยกเลิก
            </Text>
          </View>
        ) : (
          <View className="mb-2 px-2 py-2 bg-secondary/50 rounded-2xl">
            <StepperRow
              label="หมวดหมู่ ในเมนูเลือก"
              cols={columns} rows={rows}
              colMin={MIN_COLS} colMax={MAX_COLS}
              rowMin={MIN_ROWS} rowMax={MAX_ROWS}
              onCol={adjustColumns} onRow={adjustRows}
            />
            <View className="h-px bg-border/60 my-2" />
            <StepperRow
              label="หมวดใช้บ่อย"
              cols={recCatCols} rows={recCatRows}
              colMin={REC_CAT_MIN_COLS} colMax={REC_CAT_MAX_COLS}
              rowMin={REC_CAT_MIN_ROWS} rowMax={REC_CAT_MAX_ROWS}
              onCol={adjustRecCatCols} onRow={adjustRecCatRows}
            />
            <View className="h-px bg-border/60 my-1.5" />
            <StepperRow
              label="รายการใช้บ่อย"
              cols={recTxCols} rows={recTxRowsN}
              colMin={REC_TX_MIN_COLS} colMax={REC_TX_MAX_COLS}
              rowMin={REC_TX_MIN_ROWS} rowMax={REC_TX_MAX_ROWS}
              onCol={adjustRecTxCols} onRow={adjustRecTxRows}
            />
            <View className="h-px bg-border/60 my-2" />
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground text-xs font-semibold flex-1" numberOfLines={1}>
                แท็บเริ่มต้น
              </Text>
              <View className="flex-row bg-card rounded-full p-0.5 border border-border">
                <Pressable
                  onPress={() => {
                    if (defaultCategoryTab !== 'recommend') {
                      Haptics.selectionAsync();
                      updateSettings({ defaultCategoryTab: 'recommend' });
                    }
                  }}
                  className={`px-3 py-1 rounded-full ${defaultCategoryTab === 'recommend' ? 'bg-primary' : ''}`}
                >
                  <Text className={`text-[11px] font-semibold ${defaultCategoryTab === 'recommend' ? 'text-primary-foreground' : 'text-foreground'}`}>
                    แนะนำ
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (defaultCategoryTab !== 'select') {
                      Haptics.selectionAsync();
                      updateSettings({ defaultCategoryTab: 'select' });
                    }
                  }}
                  className={`px-3 py-1 rounded-full ${defaultCategoryTab === 'select' ? 'bg-primary' : ''}`}
                >
                  <Text className={`text-[11px] font-semibold ${defaultCategoryTab === 'select' ? 'text-primary-foreground' : 'text-foreground'}`}>
                    เลือก
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )
      )}

      <GestureDetector gesture={blockSheetPan}>
        <ScrollView
          style={tab !== 'manage' ? { maxHeight: ITEM_HEIGHT * rows } : undefined}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {tab === 'recommend' ? (
            <View>
              {!walletId ? (
                <View className="items-center py-6">
                  <Ionicons name="wallet-outline" size={28} color="#A39685" />
                  <Text className="text-muted-foreground text-xs mt-1">เลือกกระเป๋าเพื่อดูรายการที่ใช้บ่อย</Text>
                </View>
              ) : (
                <>
                  <Text className="text-muted-foreground text-[11px] font-semibold mb-1">หมวดที่ใช้บ่อย</Text>
                  {topCategories.length === 0 ? (
                    <View className="items-center py-3">
                      <Text className="text-muted-foreground text-xs">ยังไม่มีข้อมูลในกระเป๋านี้</Text>
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap mb-2">
                      {topCategories.map((cat) => {
                        const isSelected = cat.id === selectedId;
                        return (
                          <Pressable
                            key={cat.id}
                            onPress={() => {
                              Haptics.selectionAsync();
                              onSelect(cat);
                            }}
                            style={{ width: `${100 / recCatCols}%` }}
                            className="items-center mb-2"
                          >
                            <View
                              className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? 'border-2 border-primary' : ''}`}
                              style={{ backgroundColor: cat.color }}
                            >
                              <Ionicons
                                name={cat.icon as keyof typeof Ionicons.glyphMap}
                                size={22}
                                color="white"
                              />
                            </View>
                            <Text
                              className={`text-[11px] text-center mt-1 px-0.5 ${isSelected ? 'text-primary font-semibold' : 'text-foreground'}`}
                              numberOfLines={1}
                            >
                              {cat.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  <Text className="text-muted-foreground text-[11px] font-semibold mb-1 mt-1">รายการที่ใช้บ่อย</Text>
                  {topAnalyses.length === 0 ? (
                    <View className="items-center py-3">
                      <Text className="text-muted-foreground text-xs">ยังไม่มีรายการซ้ำในกระเป๋านี้</Text>
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap -mx-0.5">
                      {topAnalyses.map((a) => {
                        const cat = categories.find(c => c.id === a.categoryId);
                        if (!cat) return null;
                        const isActive = selectedId === cat.id && selectedAmount === a.amount;
                        return (
                          <View key={a.id} style={{ width: `${100 / recTxCols}%`, paddingHorizontal: 2, marginBottom: 6 }}>
                            <Pressable
                              onPress={() => handleRecommendTx(a)}
                              className={`flex-row items-center py-1.5 px-1 rounded-2xl border ${isActive ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                            >
                              <View
                                className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${isActive ? 'border-2 border-primary' : ''}`}
                                style={{ backgroundColor: cat.color }}
                              >
                                <Ionicons
                                  name={cat.icon as keyof typeof Ionicons.glyphMap}
                                  size={16}
                                  color="white"
                                />
                              </View>
                              <View className="flex-1">
                                <Text
                                  className={`text-[9px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}
                                  numberOfLines={1}
                                >
                                  {cat.name}
                                </Text>
                                <Text
                                  className={`text-[16px] font-bold ${type === 'income' ? 'text-income' : 'text-expense'}`}
                                  numberOfLines={1}
                                >
                                  {formatCurrency(a.amount)}
                                </Text>
                              </View>
                              {isActive && (
                                <Ionicons name="checkmark-circle" size={16} color="#E87A3D" style={{ marginLeft: 2 }} />
                              )}
                              {/* {a.count > 1 && (
                                <View className="px-1.5 py-0.5 rounded-full bg-primary/10">
                                  <Text className="text-primary text-[10px] font-bold">×{a.count}</Text>
                                </View>
                              )} */}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </View>
          ) : tab === 'select' ? (
            <View className="flex-row flex-wrap">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onSelect(cat);
                    }}
                    style={{ width: `${100 / columns}%` }}
                    className="items-center mb-2"
                  >
                    <View
                      className={`w-14 h-14 rounded-full items-center justify-center ${isSelected ? 'border-2 border-primary' : ''
                        }`}
                      style={{ backgroundColor: cat.color }}
                    >
                      <Ionicons
                        name={cat.icon as keyof typeof Ionicons.glyphMap}
                        size={26}
                        color="white"
                      />
                    </View>
                    <Text
                      className={`text-xs text-center mt-1 px-0.5 ${isSelected ? 'text-primary font-semibold' : 'text-foreground'
                        }`}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View>
              <View className="flex-row flex-wrap">
                {categories.map((cat) => {
                  const isPicked = pickedId === cat.id;
                  const isTarget = pickedId && !isPicked;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => handleManageTap(cat)}
                      onLongPress={() => pickUp(cat.id)}
                      delayLongPress={250}
                      style={{ width: `${100 / columns}%` }}
                      className="items-center mb-2"
                    >
                      <View
                        className={`w-14 h-14 rounded-full items-center justify-center ${isPicked ? 'border-2 border-primary opacity-60' : isTarget ? 'border-2 border-dashed border-primary/50' : ''
                          }`}
                        style={{ backgroundColor: cat.color }}
                      >
                        <Ionicons
                          name={cat.icon as keyof typeof Ionicons.glyphMap}
                          size={26}
                          color="white"
                        />
                        {cat.isCustom ? (
                          <Pressable
                            onPress={() => handleDelete(cat)}
                            hitSlop={8}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-expense items-center justify-center border-2 border-background"
                          >
                            <Ionicons name="close" size={12} color="white" />
                          </Pressable>
                        ) : (
                          <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted items-center justify-center border-2 border-background">
                            <Ionicons name="lock-closed" size={10} color="#A39685" />
                          </View>
                        )}
                      </View>
                      <Text
                        className={`text-xs text-center mt-1 px-0.5 ${isPicked ? 'text-primary font-semibold' : 'text-foreground'}`}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => setAddVisible(true)}
                  style={{ width: `${100 / columns}%` }}
                  className="items-center mb-2"
                >
                  <View className="w-14 h-14 rounded-full items-center justify-center border-2 border-dashed border-primary/60 bg-primary/5">
                    <Ionicons name="add" size={26} color="#E87A3D" />
                  </View>
                  <Text className="text-xs text-center mt-1 px-0.5 text-primary font-semibold" numberOfLines={1}>
                    เพิ่ม
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </GestureDetector>

      <AddCategoryModal
        visible={addVisible}
        type={type}
        onClose={() => setAddVisible(false)}
      />
    </View>
  );
}
