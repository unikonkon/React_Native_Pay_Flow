import { CAT_CATEGORY_ICON_KEYS, CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_GROUPS,
  SUGGESTED_EXPENSE_CATEGORIES,
  getCategoryGroupId,
  type CategoryGroupId,
} from '@/lib/constants/categories';
import { useCategoryStore } from '@/lib/stores/category-store';
import type { TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface Props {
  visible: boolean;
  type: TransactionType;
  onClose: () => void;
}

// Use the full set of cat-themed icons + curated color palette exported from
// the shared constants — single source of truth, keeps every category-related
// UI (this modal, defaults, suggestions) in visual sync.
const ICON_OPTIONS = CAT_CATEGORY_ICON_KEYS;
const COLOR_OPTIONS = CATEGORY_COLOR_OPTIONS;

// Group ICON_OPTIONS using the shared CATEGORY_GROUPS classifier so this
// picker mirrors CategoryGridModal / settings — one source of truth lives in
// `lib/constants/categories.ts`. Computed once at module load (deps are
// constant), kinds not matching any group fall into "อื่นๆ".
const ICON_GROUPS: { group: typeof CATEGORY_GROUPS[number]; icons: string[] }[] = (() => {
  const buckets = new Map<CategoryGroupId, string[]>();
  for (const ic of ICON_OPTIONS) {
    const id = getCategoryGroupId(ic);
    const arr = buckets.get(id) ?? [];
    arr.push(ic);
    buckets.set(id, arr);
  }
  return CATEGORY_GROUPS.map((group) => ({
    group,
    icons: buckets.get(group.id) ?? [],
  })).filter((s) => s.icons.length > 0);
})();

export function AddCategoryModal({ visible, type, onClose }: Props) {
  const addCategory = useCategoryStore(s => s.addCategory);
  const categories = useCategoryStore(s => s.categories);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
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

  const suggestions = useMemo(() => {
    if (type !== 'expense') return [];
    const existing = new Set(
      categories.filter(c => c.type === 'expense').map(c => c.name.trim())
    );
    return SUGGESTED_EXPENSE_CATEGORIES.filter(s => !existing.has(s.name));
  }, [type, categories]);

  const applySuggestion = (s: { name: string; icon: string; color: string }) => {
    Haptics.selectionAsync();
    setName(s.name);
    setIcon(s.icon);
    setColor(s.color);
  };

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
          style={{ maxHeight: '89%' }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-bold text-lg" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold' }}>
              เพิ่มหมวด{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
            </Text>
       
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#6B5F52" />
            </Pressable>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {suggestions.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Ionicons name="sparkles" size={13} color="#E87A3D" />
                  <Text
                    className="text-foreground"
                    style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}
                  >
                    หมวดที่แนะนำ
                  </Text>
                  <Text
                    className="text-muted-foreground"
                    style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }}
                  >
                    · กดเพื่อใช้ทันที
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingVertical: 2, paddingRight: 4 }}
                >
                  <View style={{ flexDirection: 'column', gap: 6 }}>
                    {[0, 1].map((row) => (
                      <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
                        {suggestions.filter((_, i) => i % 2 === row).map((s) => (
                          <Pressable
                            key={s.name}
                            onPress={() => applySuggestion(s)}
                            style={({ pressed }) => ({
                              opacity: pressed ? 0.75 : 1,
                              transform: [{ scale: pressed ? 0.97 : 1 }],
                            })}
                            accessibilityRole="button"
                            accessibilityLabel={`ใช้หมวดแนะนำ ${s.name}`}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingLeft: 4,
                                paddingRight: 10,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: s.color + '1F',
                                borderWidth: 1,
                                borderColor: s.color + '55',
                              }}
                            >
                              <CatCategoryIcon kind={s.icon} bg={s.color} size={22} />
                              <Text
                                className="text-foreground"
                                style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12.5 }}
                              >
                                {s.name}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View className="items-center">
              <CatCategoryIcon kind={icon} bg={color} size={80} />
            </View>

            <Text className="text-foreground font-semibold " style={{ fontFamily: 'IBMPlexSansThai_400Regular' }}>ชื่อ</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="ชื่อหมวดหมู่"
              placeholderTextColor="#999"
              className="border border-border rounded-xl px-3 py-3 mb-4 text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_400Regular' }}
            />

            <Text className="text-foreground font-semibold" style={{ fontFamily: 'IBMPlexSansThai_400Regular' }}>ไอคอน</Text>
            <View className="mb-4">
              {ICON_GROUPS.map(({ group, icons }) => (
                <View key={group.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons
                      name={group.ionicon as keyof typeof Ionicons.glyphMap}
                      size={13}
                      color="#E87A3D"
                    />
                    <Text
                      className="text-muted-foreground"
                      style={{
                        fontFamily: 'IBMPlexSansThai_600SemiBold',
                        fontSize: 12,
                        marginLeft: 6,
                      }}
                    >
                      {group.name}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {icons.map((ic) => {
                      const active = icon === ic;
                      return (
                        <Pressable
                          key={ic}
                          onPress={() => setIcon(ic)}
                          className={`w-14 h-14 rounded-full items-center justify-center border ${active ? 'border-4 border-primary bg-primary/10' : 'border-border bg-background'}`}
                        >
                          <CatCategoryIcon
                            kind={ic}
                            size={38}
                            strokeColor={active ? '#E87A3D' : '#9A8D80'}
                            bare
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            <Text className="text-foreground font-semibold mb-2" style={{ fontFamily: 'IBMPlexSansThai_400Regular' }}>สี</Text>
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
              className={`py-3 rounded-full items-center bg-primary ${!name.trim() || saving ? 'opacity-50' : ''}`}
            >
              <Text className="text-primary-foreground font-bold text-base" style={{ fontFamily: 'IBMPlexSansThai_400Regular' }}>เพิ่ม</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
