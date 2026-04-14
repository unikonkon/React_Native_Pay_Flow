import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Category } from '@/types';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
}

const COLUMNS = 6;

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  const selectedCat = categories.find(c => c.id === selectedId);

  return (
    <View className="mb-4">
      {/* Header: title + selected chip */}
      <View className="flex-row items-center justify-between mb-3">
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

      {/* Grid — outer BottomSheetScrollView handles vertical scroll */}
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
              className="items-center mb-3"
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
    </View>
  );
}
