import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { AddCategoryModal } from './AddCategoryModal';

interface Props {
  visible: boolean;
  type: TransactionType;
  categories: Category[];
  onClose: () => void;
}

export function CategorySettingsModal({ visible, type, categories, onClose }: Props) {
  const showCommonCategories = useSettingsStore(s => s.showCommonCategories);
  const showTopCategories = useSettingsStore(s => s.showTopCategories);
  const showFrequentPills = useSettingsStore(s => s.showFrequentPills);
  const commonCategoryLimit = useSettingsStore(s => s.commonCategoryLimit);
  const topCategoryLimit = useSettingsStore(s => s.topCategoryLimit);
  const addTxSheetHeight = useSettingsStore(s => s.addTxSheetHeight);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const reorderCategories = useCategoryStore(s => s.reorderCategories);
  const deleteCategory = useCategoryStore(s => s.deleteCategory);
  const allCategories = useCategoryStore(s => s.categories);
  const reloadTransactions = useTransactionStore(s => s.loadTransactions);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addVisible, setAddVisible] = useState(false);

  const allCommonCats = useMemo(
    () => allCategories.filter(c => c.type === type),
    [allCategories, type]
  );

  const commonCats = useMemo(
    () => allCommonCats.slice(0, commonCategoryLimit),
    [allCommonCats, commonCategoryLimit]
  );

  const handleToggle = (key: 'showCommonCategories' | 'showTopCategories' | 'showFrequentPills', value: boolean) => {
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

  const handleSheetHeight = (delta: number) => {
    const next = Math.min(95, Math.max(50, addTxSheetHeight + delta));
    if (next !== addTxSheetHeight) {
      Haptics.selectionAsync();
      updateSettings({ addTxSheetHeight: next });
    }
  };

  const handleLongPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedId(id);
  }, []);

  const handleDeleteCategory = useCallback(async (cat: Category) => {
    if (!cat.isCustom) {
      Alert.alert('ไม่สามารถลบได้', 'หมวดหมู่เริ่มต้นไม่สามารถลบได้');
      return;
    }
    const db = getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
      [cat.id],
    );
    const txCount = row?.count ?? 0;
    const message = txCount > 0
      ? `ต้องการลบ "${cat.name}" ?\nรายการที่ใช้หมวดหมู่นี้ ${txCount} รายการจะถูกลบด้วย`
      : `ต้องการลบ "${cat.name}" ?`;
    Alert.alert('ลบหมวดหมู่', message, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive',
        onPress: async () => {
          await deleteCategory(cat.id);
          await reloadTransactions();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSelectedId(null);
        },
      },
    ]);
  }, [deleteCategory, reloadTransactions]);

  const handleTapItem = useCallback((targetId: string) => {
    if (!selectedId || selectedId === targetId) {
      setSelectedId(null);
      return;
    }
    // Swap positions in the full list
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40 items-center justify-center">
        <Pressable onPress={(e) => e.stopPropagation()} className="w-11/12 max-w-md bg-card rounded-3xl border border-border" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between" style={{ padding: 16, paddingBottom: 8 }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">ตั้งค่าหมวดหมู่</Text>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }} className="bg-secondary">
              <Ionicons name="close" size={18} color="#6B5F52" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

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
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: 'rgba(42,35,32,0.03)', borderRadius: 12, padding: 12,
              }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-foreground">
                  ความสูงปัจจุบัน
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={() => handleSheetHeight(-1)}
                    style={{
                      width: 32, height: 32, borderRadius: 16,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: addTxSheetHeight <= 50 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                    }}
                  >
                    <Ionicons name="remove" size={16} color={addTxSheetHeight <= 50 ? '#D1C7BC' : '#E87A3D'} />
                  </Pressable>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, fontVariant: ['tabular-nums'], minWidth: 46, textAlign: 'center' }} className="text-foreground">
                    {addTxSheetHeight}%
                  </Text>
                  <Pressable
                    onPress={() => handleSheetHeight(1)}
                    style={{
                      width: 32, height: 32, borderRadius: 16,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: addTxSheetHeight >= 95 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                    }}
                  >
                    <Ionicons name="add" size={16} color={addTxSheetHeight >= 95 ? '#D1C7BC' : '#E87A3D'} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: หมวดหมู่ที่ใช้มากที่สุด */}
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
              )}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: รายการที่ใช้บ่อย */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">
                    รายการที่ใช้บ่อย
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
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: หมวดหมู่ที่มีอยู่ในกระเป๋า */}
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
                <>
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

                  {/* Reorder grid — same style as TransactionForm quick row */}
                  <View style={{ borderRadius: 12, padding: 8 }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#E87A3D', marginBottom: 8, paddingHorizontal: 2 }}>
                      {selectedId ? 'กดอีกตัวเพื่อสลับตำแหน่ง' : 'กดค้างเพื่อเลือกสลับตำแหน่ง หรือ ลบหมวดหมู่'}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                      {allCommonCats.map((cat, idx) => {
                        const isVisible = idx < commonCategoryLimit;
                        const isSelected = selectedId === cat.id;
                        const isTarget = selectedId !== null && selectedId !== cat.id;
                        return (
                          <Pressable
                            key={cat.id}
                            onLongPress={() => handleLongPress(cat.id)}
                            onPress={() => selectedId ? handleTapItem(cat.id) : undefined}
                            delayLongPress={300}
                            style={{ width: 66, alignItems: 'center', gap: 2, padding: 2 }}
                          >
                            <View style={{
                              padding: isSelected ? 2 : 0, borderRadius: 999,
                              borderWidth: 2,
                              borderColor: isSelected ? '#E87A3D' : (isTarget ? 'rgba(232,122,61,0.3)' : 'transparent'),
                            }}>
                              <View style={{
                                width: 40, height: 40, borderRadius: 23,
                                backgroundColor: isVisible ? cat.color : '#D1C7BC',
                                alignItems: 'center', justifyContent: 'center',
                                opacity: isSelected ? 1 : (isVisible ? (isTarget ? 0.85 : 1) : 0.5),
                              }}>
                                <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={20} color={isVisible ? 'white' : '#F5F0E8'} />
                              </View>
                            </View>
                            <Text
                              style={{
                                width: 66, textAlign: 'center',
                                fontFamily: isSelected ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
                                fontSize: 11,
                                color: isSelected ? '#E87A3D' : (isVisible ? (isTarget ? '#2A2320' : '#9A8D80') : '#C5BAB0'),
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
                    {selectedId && (() => {
                      const selectedCat = allCommonCats.find(c => c.id === selectedId);
                      return (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                          <Pressable
                            onPress={() => setSelectedId(null)}
                            style={{
                              flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
                              backgroundColor: 'rgba(42,35,32,0.05)',
                            }}
                          >
                            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#6B5F52' }}>ยกเลิก</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => selectedCat && handleDeleteCategory(selectedCat)}
                            disabled={!selectedCat?.isCustom}
                            style={{
                              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                              paddingVertical: 10, borderRadius: 10,
                              backgroundColor: selectedCat?.isCustom ? 'rgba(208,64,64,0.12)' : 'rgba(208,64,64,0.06)',
                              opacity: selectedCat?.isCustom ? 1 : 0.5,
                            }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#D04040" />
                            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#D04040' }}>ลบหมวดหมู่นี้</Text>
                          </Pressable>
                        </View>
                      );
                    })()}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>

      <AddCategoryModal
        visible={addVisible}
        type={type}
        onClose={() => setAddVisible(false)}
      />
    </Modal>
  );
}
