import { useCategoryStore } from '@/lib/stores/category-store';
import type { TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface Props {
  visible: boolean;
  type: TransactionType;
  onClose: () => void;
}

const ICON_OPTIONS = [
  'cart', 'fast-food', 'cafe', 'car', 'bus', 'home', 'bulb', 'water',
  'wifi', 'phone-portrait', 'basket', 'shirt', 'bag', 'medkit', 'barbell',
  'film', 'game-controller', 'tv', 'people', 'heart', 'gift', 'school',
  'book', 'airplane', 'shield-checkmark', 'card', 'paw', 'briefcase',
  'sparkles', 'trending-up', 'cash', 'wallet', 'pricetag', 'star',
];

const COLOR_OPTIONS = [
  '#FF6B6B', '#F59E0B', '#FACC15', '#84CC16', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  '#E11D48', '#64748B',
];

export function AddCategoryModal({ visible, type, onClose }: Props) {
  const addCategory = useCategoryStore(s => s.addCategory);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setIcon(ICON_OPTIONS[0]);
      setColor(COLOR_OPTIONS[0]);
      setSaving(false);
    }
  }, [visible]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    await addCategory({ name: trimmed, icon, color, type });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40 items-center justify-center"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-11/12 max-w-md bg-card rounded-2xl p-4 border border-border"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-bold text-lg">
              เพิ่มหมวด{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
            </Text>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#666" />
            </Pressable>
          </View>

          <ScrollView className="max-h-[590px]" keyboardShouldPersistTaps="handled">
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={30} color="white" />
              </View>
            </View>

            <Text className="text-foreground font-semibold mb-2">ชื่อ</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="ชื่อหมวดหมู่"
              placeholderTextColor="#999"
              className="border border-border rounded-xl px-3 py-3 mb-4 text-foreground"
            />

            <Text className="text-foreground font-semibold mb-2">ไอคอน</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ICON_OPTIONS.map((ic) => {
                const active = icon === ic;
                return (
                  <Pressable
                    key={ic}
                    onPress={() => setIcon(ic)}
                    className={`w-10 h-10 rounded-full items-center justify-center border ${active ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                  >
                    <Ionicons
                      name={ic as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={active ? '#0891b2' : '#666'}
                    />
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-foreground font-semibold mb-2">สี</Text>
            <View className="flex-row flex-wrap gap-3 mb-5">
              {COLOR_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  className={`w-9 h-9 rounded-full items-center justify-center ${color === c ? 'border-2 border-foreground' : ''}`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || saving}
              className={`py-3 rounded-xl items-center bg-primary ${!name.trim() || saving ? 'opacity-50' : ''}`}
            >
              <Text className="text-primary-foreground font-bold text-base">เพิ่ม</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
