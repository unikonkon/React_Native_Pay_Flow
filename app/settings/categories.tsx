import { View, Text, Pressable, SectionList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryStore } from '@/lib/stores/category-store';
import type { Category, TransactionType } from '@/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

const CATEGORY_COLORS = [
  '#F5A185', '#B8856B', '#8AC5C5', '#F0A830', '#F59FB8',
  '#9FC9A8', '#F5D988', '#B5A8DB', '#F5B8BC', '#FFB3C7',
  '#E8B547', '#6B4A9E', '#4A7FC1', '#3E8B68', '#D4A544',
  '#A39685',
];

const CATEGORY_ICONS = [
  // Food & Drinks
  'fast-food', 'restaurant', 'cafe', 'wine', 'beer', 'pizza', 'ice-cream', 'nutrition',
  // Transport
  'car', 'car-sport', 'bus', 'train', 'bicycle', 'airplane', 'boat', 'flame',
  // Home & Bills
  'home', 'bed', 'bulb', 'water', 'wifi', 'phone-portrait', 'tv', 'construct',
  // Shopping & Personal
  'bag', 'basket', 'cart', 'shirt', 'gift', 'diamond', 'cut', 'sparkles',
  // Health & Fitness
  'medkit', 'fitness', 'barbell', 'heart', 'pulse', 'bandage', 'body', 'walk',
  // Entertainment
  'film', 'game-controller', 'musical-notes', 'headset', 'book', 'library', 'camera', 'image',
  // People & Social
  'people', 'person', 'happy', 'star', 'paw',
  // Work & Finance
  'briefcase', 'business', 'laptop', 'card', 'cash', 'wallet', 'stats-chart', 'analytics',
  'trending-up', 'calculator', 'receipt', 'shield-checkmark', 'trophy', 'ribbon',
  // Travel & Nature
  'map', 'compass', 'globe', 'sunny', 'moon', 'cloud', 'umbrella', 'leaf',
  // School
  'school', 'pencil', 'reader',
  // Other
  'build', 'hammer', 'time', 'storefront', 'ellipsis-horizontal',
];

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%'], []);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);

  const isEditing = !!editingCategory;

  const sections = useMemo(() => [
    { title: 'รายจ่าย', data: categories.filter(c => c.type === 'expense') },
    { title: 'รายรับ', data: categories.filter(c => c.type === 'income') },
  ], [categories]);

  const resetForm = useCallback(() => {
    setEditingCategory(null);
    setName('');
    setSelectedType('expense');
    setSelectedIcon(CATEGORY_ICONS[0]);
    setSelectedColor(CATEGORY_COLORS[0]);
  }, []);

  const openAddForm = useCallback(() => {
    resetForm();
    bottomSheetRef.current?.snapToIndex(0);
  }, [resetForm]);

  const openEditForm = useCallback((cat: Category) => {
    if (!cat.isCustom) return;
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedType(cat.type);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    if (isEditing && editingCategory) {
      await updateCategory(editingCategory.id, { name: name.trim(), icon: selectedIcon, color: selectedColor });
    } else {
      await addCategory({ name: name.trim(), type: selectedType, icon: selectedIcon, color: selectedColor });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    bottomSheetRef.current?.close();
  }, [name, selectedType, selectedIcon, selectedColor, isEditing, editingCategory, addCategory, updateCategory, resetForm]);

  const handleDelete = useCallback((cat: Category) => {
    if (!cat.isCustom) return;
    Alert.alert('ลบหมวดหมู่', `ต้องการลบ "${cat.name}" ?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteCategory(cat.id) },
    ]);
  }, [deleteCategory]);

  const renderItem = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() => openEditForm(item)}
      onLongPress={() => handleDelete(item)}
      className="flex-row items-center px-4 py-3 bg-card border-b border-border"
    >
      <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: item.color }}>
        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color="white" />
      </View>
      <Text className="text-foreground flex-1" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>{item.name}</Text>
      {item.isCustom && (
        <View className="bg-secondary px-2 py-0.5 rounded-xl">
          <Text className="text-muted-foreground text-xs" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}>กำหนดเอง</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem as any}
        renderSectionHeader={({ section }: any) => (
          <View className="px-4 py-2 bg-background">
            <Text className="text-muted-foreground text-xs uppercase" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }}>{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
      />

      <Pressable
        onPress={openAddForm}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={resetForm}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-foreground text-lg mb-4 text-center" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }}>
            {isEditing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
          </Text>

          <Text className="text-foreground mb-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>ชื่อ</Text>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder="ชื่อหมวดหมู่"
            placeholderTextColor="#999"
            style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 20, padding: 12, fontSize: 16, marginBottom: 16 }}
          />

          {!isEditing && (
            <>
              <Text className="text-foreground mb-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>ประเภท</Text>
              <View className="flex-row mb-4 rounded-2xl overflow-hidden border border-border">
                <Pressable onPress={() => setSelectedType('expense')} className={`flex-1 py-2.5 items-center ${selectedType === 'expense' ? 'bg-expense' : 'bg-card'}`}>
                  <Text className={`${selectedType === 'expense' ? 'text-white' : 'text-foreground'}`} style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>รายจ่าย</Text>
                </Pressable>
                <Pressable onPress={() => setSelectedType('income')} className={`flex-1 py-2.5 items-center ${selectedType === 'income' ? 'bg-income' : 'bg-card'}`}>
                  <Text className={`${selectedType === 'income' ? 'text-white' : 'text-foreground'}`} style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>รายรับ</Text>
                </Pressable>
              </View>
            </>
          )}

          <Text className="text-foreground mb-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>ไอคอน</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORY_ICONS.map(icon => (
              <Pressable key={icon} onPress={() => setSelectedIcon(icon)} className={`w-10 h-10 rounded-full items-center justify-center ${selectedIcon === icon ? 'border-2 border-primary' : 'bg-secondary'}`}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={selectedIcon === icon ? '#E87A3D' : '#666'} />
              </Pressable>
            ))}
          </View>

          <Text className="text-foreground mb-2" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }}>สี</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {CATEGORY_COLORS.map(color => (
              <Pressable key={color} onPress={() => setSelectedColor(color)} className={`w-9 h-9 rounded-full items-center justify-center ${selectedColor === color ? 'border-2 border-foreground' : ''}`} style={{ backgroundColor: color }}>
                {selectedColor === color && <Ionicons name="checkmark" size={18} color="white" />}
              </Pressable>
            ))}
          </View>

          <Pressable onPress={handleSave} className={`py-4 rounded-full items-center bg-primary ${!name.trim() ? 'opacity-50' : ''}`} disabled={!name.trim()}>
            <Text className="text-white text-lg" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }}>{isEditing ? 'อัพเดท' : 'เพิ่ม'}</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
