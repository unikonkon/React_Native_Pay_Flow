import type { Category } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  categories: Category[];
  selectedId?: string;
  onSelect: (cat: Category) => void;
  onClose: () => void;
  columns?: number;
}

export function CategoryGridModal({ visible, categories, selectedId, onSelect, onClose, columns = 5 }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40 items-center justify-center">
        <Pressable onPress={(e) => e.stopPropagation()} className="w-11/12 max-w-md bg-card rounded-3xl border border-border" style={{ maxHeight: '70%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between" style={{ padding: 16, paddingBottom: 12 }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">เลือกหมวดหมู่</Text>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }} className="bg-secondary">
              <Ionicons name="close" size={18} color="#6B5F52" />
            </Pressable>
          </View>

          {/* Grid */}
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onSelect(cat);
                      onClose();
                    }}
                    style={{ width: `${100 / columns}%` }}
                    className="items-center mb-3"
                  >
                    <View
                      className="rounded-full items-center justify-center"
                      style={{
                        width: 50, height: 50,
                        backgroundColor: cat.color,
                        borderWidth: isSelected ? 2.5 : 0,
                        borderColor: '#E87A3D',
                      }}
                    >
                      <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={22} color="white" />
                    </View>
                    <Text
                      style={{
                        fontFamily: isSelected ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                        fontSize: 11, textAlign: 'center', marginTop: 4,
                      }}
                      className={isSelected ? 'text-primary' : 'text-foreground'}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
