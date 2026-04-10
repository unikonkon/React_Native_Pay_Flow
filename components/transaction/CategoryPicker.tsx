import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Category } from '@/types';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
}

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  return (
    <View className="mb-4">
      <Text className="text-foreground font-semibold mb-2">หมวดหมู่</Text>
      <ScrollView horizontal={false}>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = cat.id === selectedId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(cat);
                }}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <View
                  className="w-7 h-7 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: cat.color }}
                >
                  <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
                </View>
                <Text className={`text-sm ${isSelected ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
