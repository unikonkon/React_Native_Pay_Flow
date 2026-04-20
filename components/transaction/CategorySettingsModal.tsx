import { useSettingsStore } from '@/lib/stores/settings-store';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';

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
  const updateSettings = useSettingsStore(s => s.updateSettings);

  const handleToggle = (key: 'showCommonCategories' | 'showTopCategories' | 'showFrequentPills', value: boolean) => {
    Haptics.selectionAsync();
    updateSettings({ [key]: value });
  };

  const handleCount = (key: 'commonCategoryLimit' | 'topCategoryLimit', delta: number) => {
    const current = key === 'commonCategoryLimit' ? commonCategoryLimit : topCategoryLimit;
    const next = Math.min(20, Math.max(3, current + delta));
    if (next !== current) {
      Haptics.selectionAsync();
      updateSettings({ [key]: next });
    }
  };

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
            {/* Section: หมวดหมู่ที่มีอยู่ในกระเป๋า */}
            <View style={{ marginBottom: 20 }}>
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
                  thumbColor="#fff"
                />
              </View>

              {showCommonCategories && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: 'rgba(42,35,32,0.03)', borderRadius: 12, padding: 12,
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
                        backgroundColor: commonCategoryLimit >= 20 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                      }}
                    >
                      <Ionicons name="add" size={16} color={commonCategoryLimit >= 20 ? '#D1C7BC' : '#E87A3D'} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: หมวดหมู่ที่ใช้มากที่สุด */}
            <View style={{ marginBottom: 20 }}>
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
                  thumbColor="#fff"
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
                        backgroundColor: topCategoryLimit >= 20 ? 'rgba(42,35,32,0.05)' : 'rgba(232,122,61,0.12)',
                      }}
                    >
                      <Ionicons name="add" size={16} color={topCategoryLimit >= 20 ? '#D1C7BC' : '#E87A3D'} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(42,35,32,0.08)', marginBottom: 20 }} />

            {/* Section: รายการที่ใช้บ่อย */}
            <View style={{ marginBottom: 20 }}>
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
                  thumbColor="#fff"
                />
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
