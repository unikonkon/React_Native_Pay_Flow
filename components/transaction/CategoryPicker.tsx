import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useMemo } from 'react';
import type { Category } from '@/types';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
}

const COLUMNS = 6;
const ROWS_VISIBLE = 3;
// Per-item height: icon 56 + mt-1 (4) + text (~16) + mb-2 (8) = 84
const ITEM_HEIGHT = 84;

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  const selectedCat = categories.find(c => c.id === selectedId);

  // Capture vertical pan gestures inside the grid so they don't reach the
  // BottomSheet's pan-to-close handler. The native ScrollView still handles
  // its own vertical scrolling.
  const blockSheetPan = useMemo(
    () => Gesture.Native().shouldCancelWhenOutside(false),
    []
  );

  return (
    <View className="mb-3">
      {/* Header: title + selected chip */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-semibold">เลือกหมวดหมู่</Text>
        {selectedCat && (
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

      {/* Grid — limit to 3 rows visible, scroll Y for overflow.
          GestureDetector blocks vertical pan from triggering BottomSheet close. */}
      <GestureDetector gesture={blockSheetPan}>
        <ScrollView
          style={{ maxHeight: ITEM_HEIGHT * ROWS_VISIBLE }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
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
        </ScrollView>
      </GestureDetector>
    </View>
  );
}
