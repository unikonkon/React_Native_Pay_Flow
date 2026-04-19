import { useCategoryStore } from '@/lib/stores/category-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AddCategoryModal } from './AddCategoryModal';

interface Props {
  visible: boolean;
  type: TransactionType;
  categories: Category[];
  onClose: () => void;
}

const MIN_COLS = 3; const MAX_COLS = 8;
const MIN_ROWS = 2; const MAX_ROWS = 6;
const REC_CAT_MIN_COLS = 3; const REC_CAT_MAX_COLS = 8;
const REC_CAT_MIN_ROWS = 1; const REC_CAT_MAX_ROWS = 3;
const REC_TX_MIN_COLS = 1; const REC_TX_MAX_COLS = 4;
const REC_TX_MIN_ROWS = 1; const REC_TX_MAX_ROWS = 4;

function StepperRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (d: number) => void;
}) {
  const btn = 'w-8 h-8 rounded-full items-center justify-center bg-card border border-border';
  return (
    <View className="flex-row items-center justify-between" style={{ paddingVertical: 6 }}>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-foreground flex-1">{label}</Text>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Pressable onPress={() => onChange(-1)} disabled={value <= min} className={`${btn} ${value <= min ? 'opacity-40' : ''}`}>
          <Ionicons name="remove" size={14} color="#6B5F52" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, width: 20, textAlign: 'center' }} className="text-foreground">{value}</Text>
        <Pressable onPress={() => onChange(1)} disabled={value >= max} className={`${btn} ${value >= max ? 'opacity-40' : ''}`}>
          <Ionicons name="add" size={14} color="#6B5F52" />
        </Pressable>
      </View>
    </View>
  );
}

export function CategorySettingsModal({ visible, type, categories, onClose }: Props) {
  const {
    categoryColumns, categoryRows,
    recCategoryColumns, recCategoryRows,
    recTxColumns, recTxRows,
    updateSettings,
  } = useSettingsStore();

  const deleteCategory = useCategoryStore(s => s.deleteCategory);
  const reorderCategories = useCategoryStore(s => s.reorderCategories);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);

  const [addVisible, setAddVisible] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const columns = Math.min(MAX_COLS, Math.max(MIN_COLS, categoryColumns || 6));
  const rows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, categoryRows || 3));
  const recCatCols = Math.min(REC_CAT_MAX_COLS, Math.max(REC_CAT_MIN_COLS, recCategoryColumns || 6));
  const recCatRows = Math.min(REC_CAT_MAX_ROWS, Math.max(REC_CAT_MIN_ROWS, recCategoryRows || 1));
  const recTxCols = Math.min(REC_TX_MAX_COLS, Math.max(REC_TX_MIN_COLS, recTxColumns || 2));
  const recTxRowsN = Math.min(REC_TX_MAX_ROWS, Math.max(REC_TX_MIN_ROWS, recTxRows || 2));

  const adjust = (key: string, delta: number, cur: number, min: number, max: number) => {
    const next = Math.min(max, Math.max(min, cur + delta));
    if (next !== cur) {
      Haptics.selectionAsync();
      updateSettings({ [key]: next });
    }
  };

  const handleDelete = (cat: Category) => {
    if (!cat.isCustom) return;
    Alert.alert(
      'ลบหมวดหมู่',
      `ต้องการลบ "${cat.name}" ?\nรายการที่ใช้หมวดนี้ในทุกกระเป๋าจะถูกลบทั้งหมด`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ', style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id);
            await loadTransactions();
            await loadAnalysis();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleManageTap = (cat: Category) => {
    if (!pickedId) return;
    if (pickedId === cat.id) {
      Haptics.selectionAsync();
      setPickedId(null);
      return;
    }
    const ids = categories.map(c => c.id);
    const from = ids.indexOf(pickedId);
    const to = ids.indexOf(cat.id);
    if (from < 0 || to < 0) { setPickedId(null); return; }
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reorderCategories(type, ids);
    setPickedId(null);
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
            {/* Steppers */}
            <View className="bg-secondary rounded-2xl" style={{ padding: 12, marginBottom: 14 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 4 }} className="text-foreground">เมนูเลือกหมวด</Text>
              <StepperRow label="คอลัมน์" value={columns} min={MIN_COLS} max={MAX_COLS} onChange={d => adjust('categoryColumns', d, columns, MIN_COLS, MAX_COLS)} />
              <StepperRow label="แถว" value={rows} min={MIN_ROWS} max={MAX_ROWS} onChange={d => adjust('categoryRows', d, rows, MIN_ROWS, MAX_ROWS)} />

              <View className="bg-border" style={{ height: 0.5, marginVertical: 8 }} />
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 4 }} className="text-foreground">หมวดใช้บ่อย (Quick Row)</Text>
              <StepperRow label="จำนวน" value={recCatCols} min={REC_CAT_MIN_COLS} max={REC_CAT_MAX_COLS} onChange={d => adjust('recCategoryColumns', d, recCatCols, REC_CAT_MIN_COLS, REC_CAT_MAX_COLS)} />

              <View className="bg-border" style={{ height: 0.5, marginVertical: 8 }} />
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 4 }} className="text-foreground">รายการใช้บ่อย (Pills)</Text>
              <StepperRow label="คอลัมน์" value={recTxCols} min={REC_TX_MIN_COLS} max={REC_TX_MAX_COLS} onChange={d => adjust('recTxColumns', d, recTxCols, REC_TX_MIN_COLS, REC_TX_MAX_COLS)} />
              <StepperRow label="แถว" value={recTxRowsN} min={REC_TX_MIN_ROWS} max={REC_TX_MAX_ROWS} onChange={d => adjust('recTxRows', d, recTxRowsN, REC_TX_MIN_ROWS, REC_TX_MAX_ROWS)} />
            </View>

            {/* Reorder hint */}
            {pickedId ? (
              <View className="flex-row items-center justify-center mb-3 px-3 py-2 bg-secondary/50 rounded-2xl">
                <Ionicons name="move" size={14} color="#E87A3D" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }} className="text-primary ml-1">แตะปลายทางเพื่อวาง · แตะเดิมเพื่อยกเลิก</Text>
              </View>
            ) : (
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginBottom: 8 }} className="text-muted-foreground">กดค้างเพื่อย้ายลำดับ · แตะ ✕ เพื่อลบหมวดที่สร้างเอง</Text>
            )}

            {/* Category grid with delete/reorder */}
            <View className="flex-row flex-wrap">
              {categories.map((cat) => {
                const isPicked = pickedId === cat.id;
                const isTarget = !!pickedId && !isPicked;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleManageTap(cat)}
                    onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPickedId(cat.id); }}
                    delayLongPress={250}
                    style={{ width: `${100 / columns}%` }}
                    className="items-center mb-3"
                  >
                    <View
                      className="rounded-full items-center justify-center"
                      style={{
                        width: 50, height: 50,
                        backgroundColor: cat.color,
                        opacity: isPicked ? 0.6 : 1,
                        borderWidth: isPicked ? 2 : isTarget ? 2 : 0,
                        borderColor: '#E87A3D',
                        borderStyle: isTarget ? 'dashed' : 'solid',
                      }}
                    >
                      <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={22} color="white" />
                      {cat.isCustom && (
                        <Pressable
                          onPress={() => handleDelete(cat)}
                          hitSlop={8}
                          style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#C65A4E', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FBF7F0' }}
                        >
                          <Ionicons name="close" size={10} color="white" />
                        </Pressable>
                      )}
                    </View>
                    <Text
                      style={{ fontFamily: isPicked ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 11, textAlign: 'center', marginTop: 4 }}
                      className={isPicked ? 'text-primary' : 'text-foreground'}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Add new */}
              <Pressable
                onPress={() => setAddVisible(true)}
                style={{ width: `${100 / columns}%` }}
                className="items-center mb-3"
              >
                <View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E87A3D', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                  <Ionicons name="add" size={22} color="#E87A3D" />
                </View>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11, textAlign: 'center', marginTop: 4 }} className="text-primary">เพิ่ม</Text>
              </Pressable>
            </View>
          </ScrollView>

          <AddCategoryModal visible={addVisible} type={type} onClose={() => setAddVisible(false)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
