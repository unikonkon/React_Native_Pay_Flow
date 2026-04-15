import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { AddCategoryModal } from './AddCategoryModal';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
  type: TransactionType;
}

type Tab = 'select' | 'manage';

// Per-item height: icon 56 + mt-1 (4) + text (~16) + mb-2 (8) = 84
const ITEM_HEIGHT = 84;
const MIN_COLS = 3;
const MAX_COLS = 8;
const MIN_ROWS = 2;
const MAX_ROWS = 6;

export function CategoryPicker({ categories, selectedId, onSelect, type }: CategoryPickerProps) {
  const [tab, setTab] = useState<Tab>('select');
  const [addVisible, setAddVisible] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const deleteCategory = useCategoryStore(s => s.deleteCategory);
  const reorderCategories = useCategoryStore(s => s.reorderCategories);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);

  const { categoryColumns, categoryRows, updateSettings } = useSettingsStore();
  const columns = Math.min(MAX_COLS, Math.max(MIN_COLS, categoryColumns || 6));
  const rows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, categoryRows || 3));

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
          {tab === 'select' ? 'เลือกหมวดหมู่' : 'ตั้งค่าหมวดหมู่'}
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

      <View className="flex-row bg-secondary rounded-xl p-1 mb-2">
        <Pressable
          onPress={() => setTab('select')}
          className={`flex-1 py-1.5 rounded-lg items-center ${tab === 'select' ? 'bg-primary' : ''}`}
        >
          <Text className={`text-xs font-semibold ${tab === 'select' ? 'text-primary-foreground' : 'text-foreground'}`}>
            เลือก
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('manage')}
          className={`flex-1 py-1.5 rounded-lg items-center ${tab === 'manage' ? 'bg-primary' : ''}`}
        >
          <Text className={`text-xs font-semibold ${tab === 'manage' ? 'text-primary-foreground' : 'text-foreground'}`}>
            ตั้งค่า
          </Text>
        </Pressable>
      </View>

      {tab === 'manage' && (
        <View className="flex-row items-center justify-between mb-2 px-2 py-2 bg-secondary/50 rounded-xl">
          {pickedId ? (
            <View className="flex-1 flex-row items-center justify-center py-0.5">
              <Ionicons name="move" size={14} color="#0891b2" />
              <Text
                className="text-primary text-xs font-semibold ml-1 flex-shrink"
                numberOfLines={1}
              >
                แตะปลายทางเพื่อวาง · แตะเดิมเพื่อยกเลิก
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-center">
                <Text className="text-foreground text-xs font-semibold mr-2">คอลัมน์</Text>
                <Pressable
                  onPress={() => adjustColumns(-1)}
                  disabled={columns <= MIN_COLS}
                  className={`w-7 h-7 rounded-full items-center justify-center bg-card border border-border ${columns <= MIN_COLS ? 'opacity-40' : ''}`}
                >
                  <Ionicons name="remove" size={14} color="#666" />
                </Pressable>
                <Text className="text-foreground text-sm font-bold mx-2 w-5 text-center">{columns}</Text>
                <Pressable
                  onPress={() => adjustColumns(1)}
                  disabled={columns >= MAX_COLS}
                  className={`w-7 h-7 rounded-full items-center justify-center bg-card border border-border ${columns >= MAX_COLS ? 'opacity-40' : ''}`}
                >
                  <Ionicons name="add" size={14} color="#666" />
                </Pressable>
              </View>
              <View className="flex-row items-center">
                <Text className="text-foreground text-xs font-semibold mr-2">แถว</Text>
                <Pressable
                  onPress={() => adjustRows(-1)}
                  disabled={rows <= MIN_ROWS}
                  className={`w-7 h-7 rounded-full items-center justify-center bg-card border border-border ${rows <= MIN_ROWS ? 'opacity-40' : ''}`}
                >
                  <Ionicons name="remove" size={14} color="#666" />
                </Pressable>
                <Text className="text-foreground text-sm font-bold mx-2 w-5 text-center">{rows}</Text>
                <Pressable
                  onPress={() => adjustRows(1)}
                  disabled={rows >= MAX_ROWS}
                  className={`w-7 h-7 rounded-full items-center justify-center bg-card border border-border ${rows >= MAX_ROWS ? 'opacity-40' : ''}`}
                >
                  <Ionicons name="add" size={14} color="#666" />
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      <GestureDetector gesture={blockSheetPan}>
        <ScrollView
          style={{ maxHeight: ITEM_HEIGHT * rows }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {tab === 'select' ? (
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
                            <Ionicons name="lock-closed" size={10} color="#999" />
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
                    <Ionicons name="add" size={26} color="#0891b2" />
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
