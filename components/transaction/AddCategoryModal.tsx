import { CAT_CATEGORY_ICON_KEYS, CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_GROUPS,
  SUGGESTED_EXPENSE_CATEGORIES,
  getCategoryGroupId,
  type CategoryGroupId,
} from '@/lib/constants/categories';
import { getThemeSwatch } from '@/lib/constants/themes';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import type { TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const currentTheme = useThemeStore(s => s.currentTheme);
  const swatch = getThemeSwatch(currentTheme);
  const sheetBg = swatch?.bg ?? '#FBF7F0';
  const indicatorColor = swatch?.border ?? '#EDE4D3';

  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 220,
    easing: Easing.out(Easing.cubic),
  });

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

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleRequestClose = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const handleSheetClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    await addCategory({ name: trimmed, icon, color, type });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleRequestClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          topInset={insets.top}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          animationConfigs={animationConfigs}
          onClose={handleSheetClose}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: indicatorColor, width: 36, height: 4 }}
          backgroundStyle={{ backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between"
            style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}
          >
            <Text
              style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }}
              className="text-foreground"
            >
              เพิ่มหมวด{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
            </Text>
            <Pressable
              onPress={handleRequestClose}
              style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
              className="bg-secondary"
              hitSlop={6}
            >
              <Ionicons name="close" size={18} color="#6B5F52" />
            </Pressable>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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

            <View className="items-center" style={{ marginBottom: 8 }}>
              <CatCategoryIcon kind={icon} bg={color} size={80} />
            </View>

            <Text
              className="text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6 }}
            >
              ชื่อ
            </Text>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder="ชื่อหมวดหมู่"
              placeholderTextColor="#9A8D80"
              className="border border-border rounded-xl px-3 text-foreground bg-card"
              style={{
                fontFamily: 'IBMPlexSansThai_400Regular',
                fontSize: 15,
                paddingVertical: 10,
                marginBottom: 14,
              }}
            />

            <Text
              className="text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6 }}
            >
              ไอคอน
            </Text>
            <View style={{ marginBottom: 14 }}>
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
                          onPress={() => {
                            Haptics.selectionAsync();
                            setIcon(ic);
                          }}
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

            <Text
              className="text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6 }}
            >
              สี
            </Text>
            <View className="flex-row flex-wrap gap-3" style={{ marginBottom: 18 }}>
              {COLOR_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setColor(c);
                  }}
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
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                paddingVertical: 12, borderRadius: 999,
                backgroundColor: !name.trim() || saving ? 'rgba(232,122,61,0.4)' : '#E87A3D',
                shadowColor: '#E87A3D', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#fff' }}>
                เพิ่ม
              </Text>
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
}
