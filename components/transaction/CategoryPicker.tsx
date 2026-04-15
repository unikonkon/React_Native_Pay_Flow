import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useMemo, useState } from 'react';
import type { Category, TransactionType } from '@/types';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { AddCategoryModal } from './AddCategoryModal';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
  type: TransactionType;
}

type Tab = 'select' | 'manage';

const COLUMNS = 6;
const ROWS_VISIBLE = 3;
// Per-item height: icon 56 + mt-1 (4) + text (~16) + mb-2 (8) = 84
const ITEM_HEIGHT = 84;

export function CategoryPicker({ categories, selectedId, onSelect, type }: CategoryPickerProps) {
  const [tab, setTab] = useState<Tab>('select');
  const [addVisible, setAddVisible] = useState(false);

  const deleteCategory = useCategoryStore(s => s.deleteCategory);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);

  const selectedCat = categories.find(c => c.id === selectedId);

  // Capture vertical pan gestures inside the grid so they don't reach the
  // BottomSheet's pan-to-close handler. The native ScrollView still handles
  // its own vertical scrolling.
  const blockSheetPan = useMemo(
    () => Gesture.Native().shouldCancelWhenOutside(false),
    []
  );

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
      {/* Header: title + selected chip + tabs */}
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

      {/* Tab switcher */}
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

      {/* Grid — limit to 3 rows visible, scroll Y for overflow.
          GestureDetector blocks vertical pan from triggering BottomSheet close. */}
      <GestureDetector gesture={blockSheetPan}>
        <ScrollView
          style={{ maxHeight: ITEM_HEIGHT * ROWS_VISIBLE }}
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
                    style={{ width: `${100 / COLUMNS}%` }}
                    className="items-center mb-2"
                  >
                    <View
                      className={`w-14 h-14 rounded-full items-center justify-center ${
                        isSelected ? 'border-2 border-primary' : ''
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
                      className={`text-xs text-center mt-1 px-0.5 ${
                        isSelected ? 'text-primary font-semibold' : 'text-foreground'
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
            <View className="flex-row flex-wrap">
              {categories.map((cat) => (
                <View
                  key={cat.id}
                  style={{ width: `${100 / COLUMNS}%` }}
                  className="items-center mb-2"
                >
                  <View className="relative">
                    <View
                      className="w-14 h-14 rounded-full items-center justify-center"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Ionicons
                        name={cat.icon as keyof typeof Ionicons.glyphMap}
                        size={26}
                        color="white"
                      />
                    </View>
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
                    className="text-xs text-center mt-1 px-0.5 text-foreground"
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </View>
              ))}

              {/* Add tile */}
              <Pressable
                onPress={() => setAddVisible(true)}
                style={{ width: `${100 / COLUMNS}%` }}
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
