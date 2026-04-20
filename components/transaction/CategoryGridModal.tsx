import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AddCategoryModal } from './AddCategoryModal';

interface Props {
  visible: boolean;
  categories: Category[];
  selectedId?: string;
  type?: TransactionType;
  onSelect: (cat: Category) => void;
  onClose: () => void;
  columns?: number;
}

export function CategoryGridModal({ visible, categories, selectedId, type, onSelect, onClose, columns = 5 }: Props) {
  const [addVisible, setAddVisible] = useState(false);

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

              {/* เพิ่มหมวดหมู่ */}
              {type && (
                <Pressable
                  onPress={() => setAddVisible(true)}
                  style={{ width: `${100 / columns}%` }}
                  className="items-center mb-3"
                >
                  <View style={{
                    width: 50, height: 50, borderRadius: 25,
                    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E87A3D',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="add" size={22} color="#E87A3D" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'IBMPlexSansThai_600SemiBold',
                      fontSize: 11, textAlign: 'center', marginTop: 4, color: '#E87A3D',
                    }}
                    numberOfLines={1}
                  >
                    เพิ่ม
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>

      {type && (
        <AddCategoryModal
          visible={addVisible}
          type={type}
          onClose={() => setAddVisible(false)}
        />
      )}
    </Modal>
  );
}
