import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { getThemeSwatch } from '@/lib/constants/themes';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, Switch, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddCategoryModal } from './AddCategoryModal';

// ===== Live previews =====
//
// Each settings section gets a tiny preview card that re-renders whenever the
// underlying store value changes — the user sees how their tweak will affect
// the actual UI without having to dismiss the modal first.

function PreviewCard({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: 'rgba(42,35,32,0.04)',
      borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10,
      borderWidth: 1, borderColor: 'rgba(42,35,32,0.06)',
    }}>
      <View style={{
        paddingHorizontal: 6, paddingVertical: 2,
        backgroundColor: 'rgba(232,122,61,0.12)',
        borderRadius: 4,
      }}>
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 10, color: '#C85F28' }}>
          ตัวอย่าง
        </Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
      {hint !== undefined && (
        <Text style={{
          fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#6B5F52',
          minWidth: 32, textAlign: 'right',
        }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

// Mini phone outline + bottom sheet rectangle filled to the chosen %.
function SheetHeightPreview({ percent }: { percent: number }) {
  return (
    <View style={{
      width: 60, height: 90, borderRadius: 8,
      borderWidth: 1.5, borderColor: '#9A8D80',
      backgroundColor: '#FBF7F0', overflow: 'hidden', position: 'relative',
    }}>
      {/* Top notch indicator */}
      <View style={{ alignSelf: 'center', width: 18, height: 3, borderRadius: 1.5, backgroundColor: '#9A8D80', marginTop: 3 }} />
      {/* Sheet rises from the bottom, height scales with `percent` */}
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${percent}%`,
        backgroundColor: '#E87A3D',
        borderTopLeftRadius: 6, borderTopRightRadius: 6,
        alignItems: 'center', paddingTop: 4,
      }}>
        <View style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: '#FBF7F0' }} />
      </View>
    </View>
  );
}

// 4×4 mini calc grid with button height that scales linearly with the
// stored padding value (3..13 → 7..17 px).
function CalcPadPreview({ padding }: { padding: number }) {
  const rows = [['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '-'], ['C', '0', '.', '+']];
  const btnH = Math.round(7 + (padding - 3));
  const fontSize = Math.max(6, Math.min(9, btnH * 0.55));
  return (
    <View style={{ gap: 2, width: 110 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 2 }}>
          {row.map((label, ci) => (
            <View key={ci} style={{
              flex: 1, height: btnH,
              backgroundColor: 'rgba(232,122,61,0.18)',
              borderRadius: 3,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize, color: '#C85F28', fontFamily: 'Inter_600SemiBold' }}>{label}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Row of mini category icons — first `count` slots are filled (real cat
// icons), rest are dimmed placeholder dots so the user can see the limit
// shrink/grow live.
function TopCategoriesPreview({ count, categories }: { count: number; categories: Category[] }) {
  const slots = Math.min(8, Math.max(count, 6));
  const overflow = count - slots;
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: slots }).map((_, i) => {
        const cat = categories[i];
        const isShown = i < count;
        if (!cat) {
          return (
            <View key={i} style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: isShown ? 'rgba(232,122,61,0.20)' : 'rgba(42,35,32,0.05)',
            }} />
          );
        }
        return (
          <View key={cat.id} style={{ opacity: isShown ? 1 : 0.22 }}>
            <CatCategoryIcon kind={cat.icon} bg={cat.color} size={22} />
          </View>
        );
      })}
      {overflow > 0 && (
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#9A8D80', marginLeft: 2 }}>
          +{overflow}
        </Text>
      )}
    </View>
  );
}

// Mini "home frequent list" — N rows, each with 3 pill-shaped placeholders
// to suggest the layout density without rendering real transactions.
function HomeFrequentPreview({ rows }: { rows: number }) {
  return (
    <View style={{ width: '100%', gap: 3 }}>
      {Array.from({ length: rows }).map((_, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: 3 }).map((_, ci) => (
            <View key={ci} style={{
              flex: 1, height: 12, borderRadius: 6,
              backgroundColor: ci === 0
                ? 'rgba(232,122,61,0.30)'
                : ci === 1
                  ? 'rgba(232,122,61,0.18)'
                  : 'rgba(42,35,32,0.08)',
            }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// Mini frequent-pills row — small rounded pills suggesting the in-form
// frequent picker. Static row, just to convey "pills will appear".
function FrequentPillsPreview() {
  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
      {[26, 30, 24, 28].map((w, i) => (
        <View key={i} style={{
          width: w, height: 10, borderRadius: 5,
          backgroundColor: 'rgba(232,122,61,0.30)',
        }} />
      ))}
    </View>
  );
}

// Mini category-picker grid — first `count` real icons, capped at 12 to keep
// the preview compact. Shows a "+N" pill when count exceeds the cap.
function CommonCategoriesPreview({ count, categories }: { count: number; categories: Category[] }) {
  const cap = 12;
  const visible = categories.slice(0, Math.min(count, cap));
  const overflow = count - cap;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
      {visible.map(cat => (
        <CatCategoryIcon key={cat.id} kind={cat.icon} bg={cat.color} size={20} />
      ))}
      {overflow > 0 && (
        <View style={{
          width: 20, height: 20, borderRadius: 10,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(42,35,32,0.08)',
        }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 8, color: '#6B5F52' }}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

interface Props {
  visible: boolean;
  type: TransactionType;
  categories: Category[];
  onClose: () => void;
}

export function CategorySettingsModal({ visible, type, onClose }: Props) {
  const showCommonCategories = useSettingsStore(s => s.showCommonCategories);
  const showTopCategories = useSettingsStore(s => s.showTopCategories);
  const showFrequentPills = useSettingsStore(s => s.showFrequentPills);
  const showHomeFrequentList = useSettingsStore(s => s.showHomeFrequentList);
  const homeFrequentRows = useSettingsStore(s => s.homeFrequentRows);
  const commonCategoryLimit = useSettingsStore(s => s.commonCategoryLimit);
  const topCategoryLimit = useSettingsStore(s => s.topCategoryLimit);
  const addTxSheetHeight = useSettingsStore(s => s.addTxSheetHeight);
  const calcPadButtonPadding = useSettingsStore(s => s.calcPadButtonPadding);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const reorderCategories = useCategoryStore(s => s.reorderCategories);
  const deleteCategory = useCategoryStore(s => s.deleteCategory);
  const allCategories = useCategoryStore(s => s.categories);
  const reloadTransactions = useTransactionStore(s => s.loadTransactions);

  const currentTheme = useThemeStore(s => s.currentTheme);
  const swatch = getThemeSwatch(currentTheme);
  const sheetBg = swatch?.bg ?? '#FBF7F0';
  const indicatorColor = swatch?.border ?? '#EDE4D3';

  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['94%'], []);
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 220,
    easing: Easing.out(Easing.cubic),
  });

  type CatMode = 'reorder' | 'delete';
  const [catMode, setCatMode] = useState<CatMode>('reorder');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<Set<string>>(() => new Set());
  const [addVisible, setAddVisible] = useState(false);

  // Reset transient state every time the sheet is reopened
  useEffect(() => {
    if (visible) {
      setSelectedId(null);
      setDeleteIds(new Set());
      setCatMode('reorder');
    }
  }, [visible]);

  const switchMode = useCallback((next: CatMode) => {
    if (next === catMode) return;
    Haptics.selectionAsync();
    setSelectedId(null);
    setDeleteIds(new Set());
    setCatMode(next);
  }, [catMode]);

  const allCommonCats = useMemo(
    () => allCategories.filter(c => c.type === type),
    [allCategories, type]
  );

  const handleToggle = (
    key: 'showCommonCategories' | 'showTopCategories' | 'showFrequentPills' | 'showHomeFrequentList',
    value: boolean,
  ) => {
    Haptics.selectionAsync();
    updateSettings({ [key]: value });
  };

  const handleCount = (key: 'commonCategoryLimit' | 'topCategoryLimit', delta: number) => {
    const current = key === 'commonCategoryLimit' ? commonCategoryLimit : topCategoryLimit;
    const next = Math.min(29, Math.max(3, current + delta));
    if (next !== current) {
      Haptics.selectionAsync();
      updateSettings({ [key]: next });
    }
  };

  const handleHomeFrequentRows = (delta: number) => {
    const next = Math.min(4, Math.max(1, homeFrequentRows + delta));
    if (next !== homeFrequentRows) {
      Haptics.selectionAsync();
      updateSettings({ homeFrequentRows: next });
    }
  };

  const handleSheetHeight = (delta: number) => {
    const next = Math.min(95, Math.max(50, addTxSheetHeight + delta));
    if (next !== addTxSheetHeight) {
      Haptics.selectionAsync();
      updateSettings({ addTxSheetHeight: next });
    }
  };

  const handleCalcPadPadding = (delta: number) => {
    // Step 0.5, range 3–1. Round to one decimal to avoid float drift.
    const raw = calcPadButtonPadding + delta;
    const next = Math.round(Math.min(13, Math.max(3, raw)) * 2) / 2;
    if (next !== calcPadButtonPadding) {
      Haptics.selectionAsync();
      updateSettings({ calcPadButtonPadding: next });
    }
  };

  // Toggle a category in/out of the delete-selection set. Default (non-custom)
  // categories cannot be deleted — surface an Alert so the user knows why.
  const toggleDeleteId = useCallback((cat: Category) => {
    if (!cat.isCustom) {
      Alert.alert('ลบไม่ได้', 'หมวดหมู่เริ่มต้นไม่สามารถลบได้');
      return;
    }
    Haptics.selectionAsync();
    setDeleteIds(prev => {
      const next = new Set(prev);
      if (next.has(cat.id)) next.delete(cat.id);
      else next.add(cat.id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (deleteIds.size === 0) return;
    const cats = allCommonCats.filter(c => deleteIds.has(c.id) && c.isCustom);
    if (cats.length === 0) return;

    // Sum affected transactions across all selected categories in one query.
    const db = getDb();
    const placeholders = cats.map(() => '?').join(',');
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM transactions WHERE category_id IN (${placeholders})`,
      cats.map(c => c.id),
    );
    const txCount = row?.count ?? 0;
    const message = txCount > 0
      ? `ต้องการลบ ${cats.length} หมวดหมู่ที่เลือก?\nรายการที่ใช้หมวดหมู่เหล่านี้ ${txCount} รายการจะถูกลบด้วย`
      : `ต้องการลบ ${cats.length} หมวดหมู่ที่เลือก?`;

    Alert.alert('ลบหมวดหมู่', message, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบทั้งหมด', style: 'destructive',
        onPress: async () => {
          for (const cat of cats) {
            await deleteCategory(cat.id);
          }
          await reloadTransactions();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setDeleteIds(new Set());
        },
      },
    ]);
  }, [deleteIds, allCommonCats, deleteCategory, reloadTransactions]);

  // Long-press routes by mode: reorder → select; delete → toggle multi-select.
  const handleLongPress = useCallback((cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (catMode === 'delete') {
      toggleDeleteId(cat);
      return;
    }
    setSelectedId(cat.id);
  }, [catMode, toggleDeleteId]);

  const handleTapItem = useCallback((targetId: string) => {
    if (!selectedId || selectedId === targetId) {
      setSelectedId(null);
      return;
    }
    const ids = allCommonCats.map(c => c.id);
    const fromIdx = ids.indexOf(selectedId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newIds = [...ids];
    newIds[fromIdx] = targetId;
    newIds[toIdx] = selectedId;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reorderCategories(type, newIds);
    setSelectedId(null);
  }, [selectedId, allCommonCats, type, reorderCategories]);

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

  // Animated dismiss: trigger sheet's own slide-down, parent unmounts on onClose callback
  const handleRequestClose = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const handleSheetClose = useCallback(() => {
    onClose();
  }, [onClose]);

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
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">
              ตั้งค่าหมวดหมู่
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
            {/* Section: ความสูงของหน้าต่าง */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">
                  ความสูงของหน้าต่าง
                </Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                  ปรับความสูงของหน้าต่างเพิ่มรายการ (50–95%)
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(42,35,32,0.04)',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1, borderColor: 'rgba(42,35,32,0.06)',
              }}>
                {/* Body — 2 columns, vertically centered. Each column carries
                    its own header (pill / subtitle) stacked above its content,
                    so labels stay glued to the thing they describe. */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
                  {/* Left column: "ตัวอย่าง" pill + live preview */}
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 2,
                      backgroundColor: 'rgba(232,122,61,0.12)',
                      borderRadius: 4,
                    }}>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 10, color: '#C85F28' }}>
                        ตัวอย่าง
                      </Text>
                    </View>
                    <SheetHeightPreview percent={addTxSheetHeight} />
                  </View>
                  {/* Right column: subtitle + big value + +/- controls */}
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground">
                      ความสูงปัจจุบัน
                    </Text>
                    <Text style={{
                      fontFamily: 'Inter_700Bold', fontSize: 28, fontVariant: ['tabular-nums'],
                    }} className="text-foreground">
                      {addTxSheetHeight}%
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                      <Pressable
                        onPress={() => handleSheetHeight(-1)}
                        style={{
                          width: 50, height: 50, borderRadius: 25,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: addTxSheetHeight <= 50 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="remove" size={18} color={addTxSheetHeight <= 50 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleSheetHeight(1)}
                        style={{
                          width: 50, height: 50, borderRadius: 25,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: addTxSheetHeight >= 95 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="add" size={18} color={addTxSheetHeight >= 95 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Section: ขนาดปุ่มเครื่องคิดเลข */}
            <View style={{ marginTop: 14, marginBottom: 10 }}>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">
                  ขนาดปุ่มเครื่องคิดเลข
                </Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                  ปรับความสูงของปุ่มกดเครื่องคิดเลข (3–13)
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(42,35,32,0.04)',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1, borderColor: 'rgba(42,35,32,0.06)',
              }}>
                {/* Body — 2 columns, vertically centered. Each column carries
                    its own header (pill / subtitle) stacked above its content. */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 50 }}>
                  {/* Left column: "ตัวอย่าง" pill + live calc-pad preview */}
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 2,
                      backgroundColor: 'rgba(232,122,61,0.12)',
                      borderRadius: 4,
                    }}>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 10, color: '#C85F28' }}>
                        ตัวอย่าง
                      </Text>
                    </View>
                    <CalcPadPreview padding={calcPadButtonPadding} />
                  </View>
                  {/* Right column: subtitle + big value + +/- controls (step 0.5) */}
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground">
                      ขนาดปัจจุบัน
                    </Text>
                    <Text style={{
                      fontFamily: 'Inter_700Bold', fontSize: 28, fontVariant: ['tabular-nums'],
                    }} className="text-foreground">
                      {calcPadButtonPadding}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                      <Pressable
                        onPress={() => handleCalcPadPadding(-0.5)}
                        style={{
                          width: 50, height: 50, borderRadius: 25,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: calcPadButtonPadding <= 3 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="remove" size={18} color={calcPadButtonPadding <= 3 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleCalcPadPadding(0.5)}
                        style={{
                          width: 50, height: 50, borderRadius: 25,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: calcPadButtonPadding >= 12 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="add" size={18} color={calcPadButtonPadding >= 12 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: หมวดหมู่ที่ใช้บ่อย */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">
                    หมวดหมู่ที่ใช้บ่อย
                  </Text>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                    แสดงหมวดหมู่ที่ใช้มากที่สุดในกระเป๋านี้
                  </Text>
                </View>
                <Switch
                  value={showTopCategories}
                  onValueChange={(v) => handleToggle('showTopCategories', v)}
                  trackColor={{ false: '#A89888', true: '#E87A3D' }}
                  thumbColor="#E5DCC9"
                />
              </View>

              {showTopCategories && (
                <Fragment>
                  <PreviewCard hint={`${topCategoryLimit}`}>
                    <TopCategoriesPreview count={topCategoryLimit} categories={allCommonCats} />
                  </PreviewCard>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: 'rgba(42,35,32,0.03)', borderRadius: 12, padding: 12,
                  }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-foreground">
                      จำนวนที่แสดง
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Pressable
                        onPress={() => handleCount('topCategoryLimit', -1)}
                        style={{
                          width: 32, height: 32, borderRadius: 16,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: topCategoryLimit <= 3 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="remove" size={16} color={topCategoryLimit <= 3 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, fontVariant: ['tabular-nums'], minWidth: 28, textAlign: 'center' }} className="text-foreground">
                        {topCategoryLimit}
                      </Text>
                      <Pressable
                        onPress={() => handleCount('topCategoryLimit', 1)}
                        style={{
                          width: 32, height: 32, borderRadius: 16,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: topCategoryLimit >= 29 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="add" size={16} color={topCategoryLimit >= 29 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                    </View>
                  </View>
                </Fragment>
              )}
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: รายการที่ใช้บ่อย */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">
                    รายการที่ใช้บ่อย (ในฟอร์ม)
                  </Text>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                    แสดงรายการบันทึกที่ใช้บ่อยเพื่อเลือกซ้ำได้เร็ว
                  </Text>
                </View>
                <Switch
                  value={showFrequentPills}
                  onValueChange={(v) => handleToggle('showFrequentPills', v)}
                  trackColor={{ false: '#A89888', true: '#E87A3D' }}
                  thumbColor="#E5DCC9"
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">
                    รายการที่ใช้บ่อย (หน้าหลัก)
                  </Text>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                    แสดงแถบรายการใช้บ่อยบนหน้ารายการ
                  </Text>
                </View>
                <Switch
                  value={showHomeFrequentList}
                  onValueChange={(v) => handleToggle('showHomeFrequentList', v)}
                  trackColor={{ false: '#A89888', true: '#E87A3D' }}
                  thumbColor="#E5DCC9"
                />
              </View>

              {(showFrequentPills || showHomeFrequentList) && (
                <View style={{ marginTop: 12 }}>
                  <PreviewCard hint={showHomeFrequentList ? `${homeFrequentRows} แถว` : undefined}>
                    <View style={{ width: '100%', gap: 6 }}>
                      {showFrequentPills && <FrequentPillsPreview />}
                      {showHomeFrequentList && <HomeFrequentPreview rows={homeFrequentRows} />}
                    </View>
                  </PreviewCard>
                </View>
              )}

              {showHomeFrequentList && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: 'rgba(42,35,32,0.03)', borderRadius: 12, padding: 12, marginTop: 10,
                }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-foreground">
                    จำนวนแถว
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Pressable
                      onPress={() => handleHomeFrequentRows(-1)}
                      style={{
                        width: 32, height: 32, borderRadius: 16,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: homeFrequentRows <= 1 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                      }}
                    >
                      <Ionicons name="remove" size={16} color={homeFrequentRows <= 1 ? '#D1C7BC' : '#E87A3D'} />
                    </Pressable>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, fontVariant: ['tabular-nums'], minWidth: 28, textAlign: 'center' }} className="text-foreground">
                      {homeFrequentRows}
                    </Text>
                    <Pressable
                      onPress={() => handleHomeFrequentRows(1)}
                      style={{
                        width: 32, height: 32, borderRadius: 16,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: homeFrequentRows >= 4 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                      }}
                    >
                      <Ionicons name="add" size={16} color={homeFrequentRows >= 4 ? '#D1C7BC' : '#E87A3D'} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: หมวดหมู่ในกระเป๋า */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">
                    หมวดหมู่ในกระเป๋า
                  </Text>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                    แสดงหมวดหมู่เริ่มต้นที่มีอยู่ในระบบ
                  </Text>
                </View>
                <Switch
                  value={showCommonCategories}
                  onValueChange={(v) => handleToggle('showCommonCategories', v)}
                  trackColor={{ false: '#A89888', true: '#E87A3D' }}
                  thumbColor="#E5DCC9"
                />
              </View>

              {showCommonCategories && (
                <Fragment>
                  <PreviewCard hint={`${commonCategoryLimit}`}>
                    <CommonCategoriesPreview count={commonCategoryLimit} categories={allCommonCats} />
                  </PreviewCard>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: 'rgba(42,35,32,0.03)', borderRadius: 12, padding: 12, marginBottom: 10,
                  }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-foreground">
                      จำนวนที่แสดง
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Pressable
                        onPress={() => handleCount('commonCategoryLimit', -1)}
                        style={{
                          width: 32, height: 32, borderRadius: 16,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: commonCategoryLimit <= 3 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="remove" size={16} color={commonCategoryLimit <= 3 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, fontVariant: ['tabular-nums'], minWidth: 28, textAlign: 'center' }} className="text-foreground">
                        {commonCategoryLimit}
                      </Text>
                      <Pressable
                        onPress={() => handleCount('commonCategoryLimit', 1)}
                        style={{
                          width: 32, height: 32, borderRadius: 16,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: commonCategoryLimit >= 29 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                        }}
                      >
                        <Ionicons name="add" size={16} color={commonCategoryLimit >= 29 ? '#D1C7BC' : '#E87A3D'} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Reorder/Delete grid */}
                  <View style={{ borderRadius: 12, padding: 8 }}>
                    {/* Mode toggle pills */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      {([
                        { key: 'reorder', icon: 'swap-horizontal' as const, label: 'สลับตำแหน่ง', activeBg: '#E87A3D', dimBg: 'rgba(232,122,61,0.12)', activeFg: '#fff', dimFg: '#C85F28' },
                        { key: 'delete', icon: 'trash-outline' as const, label: 'ลบหมวดหมู่', activeBg: '#D04040', dimBg: 'rgba(208,64,64,0.10)', activeFg: '#fff', dimFg: '#D04040' },
                      ] as const).map(opt => {
                        const active = catMode === opt.key;
                        return (
                          <Pressable
                            key={opt.key}
                            onPress={() => switchMode(opt.key)}
                            style={{
                              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                              paddingVertical: 9, borderRadius: 10,
                              backgroundColor: active ? opt.activeBg : opt.dimBg,
                            }}
                          >
                            <Ionicons name={opt.icon} size={14} color={active ? opt.activeFg : opt.dimFg} />
                            <Text style={{
                              fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 13,
                              color: active ? opt.activeFg : opt.dimFg,
                            }}>{opt.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Help text per mode */}
                    <View style={{ marginBottom: 8, paddingHorizontal: 2 }}>
                      {catMode === 'reorder' ? (
                        selectedId ? (
                          <Fragment>
                            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#E87A3D', marginBottom: 2, textAlign: 'center' }}>
                              กดอีกตัวเพื่อสลับตำแหน่ง
                            </Text>
                            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#B66B13', textAlign: 'center' }}>
                              หรือกดยกเลิกด้านล่าง
                            </Text>
                          </Fragment>
                        ) : (
                          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#E87A3D', textAlign: 'center' }}>
                            กดค้างที่หมวดหมู่ที่ต้องการ แล้วกดอีกตัวเพื่อสลับตำแหน่ง
                          </Text>
                        )
                      ) : (
                        <Fragment>
                          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#D04040', marginBottom: 2, textAlign: 'center' }}>
                            {deleteIds.size > 0
                              ? `เลือกแล้ว ${deleteIds.size} หมวดหมู่ — กดเพิ่มหรือกด "ลบ" ด้านล่าง`
                              : 'แตะหมวดหมู่ที่ต้องการลบ (เลือกได้หลายหมวด)'}
                          </Text>
                          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80', textAlign: 'center' }}>
                            (หมวดหมู่เริ่มต้นลบไม่ได้)
                          </Text>
                        </Fragment>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                      {allCommonCats.map((cat, idx) => {
                        const isVisible = idx < commonCategoryLimit;
                        const isReorderMode = catMode === 'reorder';
                        const isDeleteMode = catMode === 'delete';
                        const isSelected = isReorderMode && selectedId === cat.id;
                        const isTarget = isReorderMode && selectedId !== null && selectedId !== cat.id;
                        const isDeletable = isDeleteMode && cat.isCustom;
                        const isLocked = isDeleteMode && !cat.isCustom;
                        const isCheckedForDelete = isDeletable && deleteIds.has(cat.id);
                        const ringColor = isSelected
                          ? '#E87A3D'
                          : isTarget
                            ? 'rgba(232,122,61,0.3)'
                            : isCheckedForDelete
                              ? '#D04040'
                              : isDeletable
                                ? 'rgba(208,64,64,0.45)'
                                : 'transparent';
                        return (
                          <Pressable
                            key={cat.id}
                            onLongPress={() => handleLongPress(cat)}
                            onPress={() => {
                              if (catMode === 'delete') {
                                toggleDeleteId(cat);
                                return;
                              }
                              if (selectedId) handleTapItem(cat.id);
                            }}
                            delayLongPress={300}
                            style={{ width: 66, alignItems: 'center', gap: 2, padding: 2 }}
                          >
                            <View style={{ position: 'relative' }}>
                              <View style={{
                                padding: isSelected || isDeletable ? 2 : 0, borderRadius: 999,
                                borderWidth: isCheckedForDelete ? 2.5 : 2,
                                borderColor: ringColor,
                              }}>
                                <View style={{
                                  opacity: isSelected ? 1 : isLocked ? 0.4 : (isVisible ? (isTarget ? 0.85 : 1) : 0.5),
                                }}>
                                  <CatCategoryIcon
                                    kind={cat.icon}
                                    bg={isVisible ? cat.color : '#D1C7BC'}
                                    size={40}
                                    strokeColor={isVisible ? '#FFFFFF' : '#F5F0E8'}
                                  />
                                </View>
                              </View>
                              {/* Delete-mode badge: check when selected, trash on deletable, lock on default */}
                              {isDeleteMode && (
                                <View style={{
                                  position: 'absolute', top: -3, right: -3,
                                  width: 18, height: 18, borderRadius: 9,
                                  alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: isCheckedForDelete
                                    ? '#D04040'
                                    : isDeletable
                                      ? 'rgba(208,64,64,0.85)'
                                      : '#9A8D80',
                                  borderWidth: 1.5, borderColor: sheetBg,
                                }}>
                                  <Ionicons
                                    name={
                                      isCheckedForDelete
                                        ? 'checkmark'
                                        : isDeletable
                                          ? 'trash'
                                          : 'lock-closed'
                                    }
                                    size={isCheckedForDelete ? 12 : 10}
                                    color="#fff"
                                  />
                                </View>
                              )}
                            </View>
                            <Text
                              style={{
                                width: 66, textAlign: 'center',
                                fontFamily: isSelected || isCheckedForDelete ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                                fontSize: 11,
                                color: isSelected
                                  ? '#E87A3D'
                                  : isCheckedForDelete
                                    ? '#D04040'
                                    : isDeletable
                                      ? '#D04040'
                                      : isLocked
                                        ? '#C5BAB0'
                                        : (isVisible ? (isTarget ? '#2A2320' : '#9A8D80') : '#C5BAB0'),
                              }}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {cat.name}
                            </Text>
                          </Pressable>
                        );
                      })}

                      {/* Add new category button */}
                      <Pressable
                        onPress={() => {
                          if (selectedId) {
                            setSelectedId(null);
                            return;
                          }
                          Haptics.selectionAsync();
                          setAddVisible(true);
                        }}
                        disabled={selectedId !== null}
                        style={{ width: 66, alignItems: 'center', gap: 2, padding: 2, opacity: selectedId ? 0.4 : 1 }}
                      >
                        <View style={{
                          width: 40, height: 40, borderRadius: 23,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: 'rgba(232,122,61,0.12)',
                          borderWidth: 1.5,
                          borderColor: 'rgba(232,122,61,0.4)',
                          borderStyle: 'dashed',
                        }}>
                          <Ionicons name="add" size={22} color="#E87A3D" />
                        </View>
                        <Text
                          style={{
                            width: 66, textAlign: 'center',
                            fontFamily: 'IBMPlexSansThai_600SemiBold',
                            fontSize: 11,
                            color: '#E87A3D',
                          }}
                          numberOfLines={1}
                        >
                          เพิ่ม
                        </Text>
                      </Pressable>
                    </View>

                    {catMode === 'reorder' && selectedId && (
                      <View style={{ marginTop: 10 }}>
                        <Pressable
                          onPress={() => setSelectedId(null)}
                          style={{
                            alignItems: 'center', paddingVertical: 10, borderRadius: 10,
                            backgroundColor: 'rgba(42,35,32,0.05)',
                          }}
                        >
                          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#6B5F52' }}>ยกเลิกการเลือก</Text>
                        </Pressable>
                      </View>
                    )}

                    {catMode === 'delete' && deleteIds.size > 0 && (
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <Pressable
                          onPress={() => setDeleteIds(new Set())}
                          style={{
                            flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
                            backgroundColor: 'rgba(42,35,32,0.05)',
                          }}
                        >
                          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#6B5F52' }}>
                            ยกเลิก
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleBulkDelete}
                          style={{
                            flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                            paddingVertical: 10, borderRadius: 10,
                            backgroundColor: '#D04040',
                            shadowColor: '#D04040', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                            elevation: 4,
                          }}
                        >
                          <Ionicons name="trash" size={14} color="#fff" />
                          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 13, color: '#fff' }}>
                            ลบ ({deleteIds.size})
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Fragment>
              )}
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>

      {/* Render INSIDE parent Modal so the OS stacks this child Dialog/ViewController above the sheet */}
      <AddCategoryModal
        visible={addVisible}
        type={type}
        onClose={() => setAddVisible(false)}
      />
    </Modal>
  );
}
