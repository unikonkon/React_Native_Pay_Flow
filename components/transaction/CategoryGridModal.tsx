import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { groupCategoriesByType } from '@/lib/constants/categories';
import { getThemeSwatch } from '@/lib/constants/themes';
import { useThemeStore } from '@/lib/stores/theme-store';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export function CategoryGridModal({
  visible,
  categories,
  selectedId,
  type,
  onSelect,
  onClose,
  columns = 5,
}: Props) {
  const [addVisible, setAddVisible] = useState(false);

  const currentTheme = useThemeStore(s => s.currentTheme);
  const swatch = getThemeSwatch(currentTheme);
  const sheetBg = swatch?.bg ?? '#FBF7F0';
  const indicatorColor = swatch?.border ?? '#EDE4D3';

  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 220,
    easing: Easing.out(Easing.cubic),
  });

  const sections = useMemo(() => groupCategoriesByType(categories), [categories]);

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

  // Build flat children + collect sticky-header indices so the section
  // headers pin to the top of the ScrollView as the user scrolls.
  const { children, stickyIndices } = useMemo(() => {
    const out: React.ReactNode[] = [];
    const sticky: number[] = [];

    sections.forEach(({ group, items }) => {
      sticky.push(out.length);
      out.push(
        <View
          key={`hdr-${group.id}`}
          className="flex-row items-center"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: sheetBg,
          }}
        >
          <Ionicons
            name={group.ionicon as React.ComponentProps<typeof Ionicons>['name']}
            size={16}
            color="#E87A3D"
          />
          <Text
            className="text-foreground"
            style={{
              fontFamily: 'IBMPlexSansThai_600SemiBold',
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            {group.name}
          </Text>
        </View>
      );
      out.push(
        <View
          key={`grp-${group.id}`}
          className="flex-row flex-wrap"
          style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4 }}
        >
          {items.map((cat) => {
            const isSelected = cat.id === selectedId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(cat);
                  handleRequestClose();
                }}
                style={{ width: `${100 / columns}%` }}
                className="items-center mb-3"
              >
                <View
                  style={{
                    borderRadius: 999,
                    borderWidth: isSelected ? 4 : 0,
                    borderColor: '#E87A3D',
                    padding: isSelected ? 2 : 0,
                  }}
                >
                  <CatCategoryIcon kind={cat.icon} bg={cat.color} size={50} />
                </View>
                <Text
                  style={{
                    fontFamily: isSelected
                      ? 'IBMPlexSansThai_600SemiBold'
                      : 'IBMPlexSansThai_400Regular',
                    fontSize: 11,
                    textAlign: 'center',
                    marginTop: 4,
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
      );
    });

    return { children: out, stickyIndices: sticky };
  }, [sections, selectedId, columns, onSelect, handleRequestClose, sheetBg]);

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
              เลือกหมวดหมู่
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

          {/* Sectioned grid — sticky group headers, items wrap horizontally */}
          <BottomSheetScrollView
            stickyHeaderIndices={stickyIndices}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
          >
            {children}

            {/* "+ เพิ่มหมวด" — sits at the very end (no sticky header) */}
            {type && (
              <View
                className="flex-row flex-wrap"
                style={{ paddingHorizontal: 12, paddingTop: 8 }}
              >
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAddVisible(true);
                  }}
                  style={{ width: `${100 / columns}%` }}
                  className="items-center mb-3"
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: '#E87A3D',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={22} color="#E87A3D" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'IBMPlexSansThai_600SemiBold',
                      fontSize: 11,
                      textAlign: 'center',
                      marginTop: 4,
                      color: '#E87A3D',
                    }}
                    numberOfLines={1}
                  >
                    เพิ่ม
                  </Text>
                </Pressable>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>

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
