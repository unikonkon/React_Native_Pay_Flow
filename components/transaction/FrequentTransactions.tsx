import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Analysis, Category } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import * as Haptics from 'expo-haptics';

interface FrequentTransactionsProps {
  analyses: Analysis[];
  categories: Category[];
  onSelect: (analysis: Analysis) => void;
}

export function FrequentTransactions({ analyses, categories, onSelect }: FrequentTransactionsProps) {
  if (analyses.length === 0) return null;

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const handleSelect = (analysis: Analysis) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(analysis);
  };

  return (
    <View className="px-4 py-3 bg-card border-b border-border">
      <Text className="text-muted-foreground text-xs font-semibold mb-2">รายการใช้บ่อย</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {analyses.map((analysis) => {
            const cat = getCategoryById(analysis.categoryId);
            return (
              <Pressable
                key={analysis.id}
                onPress={() => handleSelect(analysis)}
                className="items-center w-16"
              >
                <View
                  className="w-11 h-11 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: cat?.color ?? '#999' }}
                >
                  <Ionicons
                    name={(cat?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color="white"
                  />
                </View>
                <Text className="text-foreground text-xs text-center" numberOfLines={1}>
                  {cat?.name ?? 'อื่นๆ'}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {formatCurrency(analysis.amount)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
