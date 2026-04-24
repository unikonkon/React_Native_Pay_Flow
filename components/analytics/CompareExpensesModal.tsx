import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getTransactionsByRange } from '@/lib/stores/db';
import { formatCurrency } from '@/lib/utils/format';
import type { Category, Transaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

interface MonthKey {
  year: number;
  month: number; // 0-based
}

function monthRange(m: MonthKey): { start: string; end: string } {
  const start = `${m.year}-${String(m.month + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(m.year, m.month + 1, 1);
  const endDate = new Date(nextMonth.getTime() - 1);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

function monthKeyStr(m: MonthKey): string {
  return `${m.year}-${m.month}`;
}

function monthLabel(m: MonthKey, full = false): string {
  const buddhist = m.year + 543;
  const label = full ? THAI_MONTHS_FULL[m.month] : THAI_MONTHS_SHORT[m.month];
  return `${label} ${buddhist}`;
}

function defaultMonths(): { a: MonthKey; b: MonthKey } {
  const now = new Date();
  const b: MonthKey = { year: now.getFullYear(), month: now.getMonth() };
  const a: MonthKey = now.getMonth() > 0
    ? { year: now.getFullYear(), month: now.getMonth() - 1 }
    : { year: now.getFullYear() - 1, month: 11 };
  return { a, b };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  walletId?: string | null;
}

export function CompareExpensesModal({ visible, onClose, walletId }: Props) {
  const categories = useCategoryStore(s => s.categories);

  const initial = useMemo(() => defaultMonths(), []);
  const [monthA, setMonthA] = useState<MonthKey>(initial.a);
  const [monthB, setMonthB] = useState<MonthKey>(initial.b);
  const [txsA, setTxsA] = useState<Transaction[]>([]);
  const [txsB, setTxsB] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    if (!visible) return;
    const d = defaultMonths();
    setMonthA(d.a);
    setMonthB(d.b);
  }, [visible]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDb();
      const rA = monthRange(monthA);
      const rB = monthRange(monthB);
      const [a, b] = await Promise.all([
        getTransactionsByRange(db, rA.start, rA.end, walletId),
        getTransactionsByRange(db, rB.start, rB.end, walletId),
      ]);
      setTxsA(a.filter(t => t.type === 'expense'));
      setTxsB(b.filter(t => t.type === 'expense'));
    } catch {
      setTxsA([]);
      setTxsB([]);
    } finally {
      setLoading(false);
    }
  }, [monthA, monthB, walletId]);

  useEffect(() => {
    if (visible) requestAnimationFrame(() => loadData());
  }, [visible, loadData]);

  const comparison = useMemo(() => {
    const byCatA = new Map<string, { amount: number; count: number }>();
    const byCatB = new Map<string, { amount: number; count: number }>();

    for (const tx of txsA) {
      const ex = byCatA.get(tx.categoryId);
      if (ex) { ex.amount += tx.amount; ex.count++; } else byCatA.set(tx.categoryId, { amount: tx.amount, count: 1 });
    }
    for (const tx of txsB) {
      const ex = byCatB.get(tx.categoryId);
      if (ex) { ex.amount += tx.amount; ex.count++; } else byCatB.set(tx.categoryId, { amount: tx.amount, count: 1 });
    }

    const totalA = txsA.reduce((s, t) => s + t.amount, 0);
    const totalB = txsB.reduce((s, t) => s + t.amount, 0);

    const allCatIds = new Set([...byCatA.keys(), ...byCatB.keys()]);
    const rows: CompareRow[] = Array.from(allCatIds).map((catId) => {
      const cat = categories.find(c => c.id === catId);
      const a = byCatA.get(catId);
      const b = byCatB.get(catId);
      const amountA = a?.amount ?? 0;
      const amountB = b?.amount ?? 0;
      const delta = amountB - amountA;
      const deltaPct = amountA > 0
        ? (delta / amountA) * 100
        : (amountB > 0 ? 100 : 0);
      return {
        categoryId: catId,
        category: cat,
        amountA,
        amountB,
        countA: a?.count ?? 0,
        countB: b?.count ?? 0,
        delta,
        deltaPct,
      };
    }).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

    return {
      totalA,
      totalB,
      totalDelta: totalB - totalA,
      totalDeltaPct: totalA > 0 ? ((totalB - totalA) / totalA) * 100 : 0,
      rows,
    };
  }, [txsA, txsB, categories]);

  const monthOptions: MonthKey[] = useMemo(() => {
    const options: MonthKey[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 0; i < 24; i++) {
      options.push({ year: d.getFullYear(), month: d.getMonth() });
      d.setMonth(d.getMonth() - 1);
    }
    return options;
  }, []);

  const selectMonth = (slot: 'A' | 'B', m: MonthKey) => {
    Haptics.selectionAsync();
    if (slot === 'A') setMonthA(m); else setMonthB(m);
    setPickerOpen(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="bg-accent" style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center"
                style={{ width: 40, height: 40, backgroundColor: '#E87A3D22' }}
              >
                <Ionicons name="swap-horizontal" size={20} color="#E87A3D" />
              </View>
              <View className="ml-3 flex-1">
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">เทียบรายจ่าย</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">เปรียบเทียบเดือนต่อเดือน</Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-full bg-card/80">
              <Ionicons name="close" size={22} className="text-muted-foreground" color="#A39685" />
            </Pressable>
          </View>
        </View>

        {/* Month selectors */}
        <View style={{ flexDirection: 'row', gap: 24, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
          <MonthPill
            label={monthLabel(monthA)}
            sublabel="ก่อนหน้า"
            color="#8AC5C5"
            onPress={() => { Haptics.selectionAsync(); setPickerOpen('A'); }}
          />
          <Ionicons name="swap-horizontal" size={22} color="#A39685" />
          <MonthPill
            label={monthLabel(monthB)}
            sublabel="ปัจจุบัน"
            color="#E87A3D"
            onPress={() => { Haptics.selectionAsync(); setPickerOpen('B'); }}
          />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#E87A3D" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <TotalsCard
              totalA={comparison.totalA}
              totalB={comparison.totalB}
              labelA={monthLabel(monthA)}
              labelB={monthLabel(monthB)}
              delta={comparison.totalDelta}
              deltaPct={comparison.totalDeltaPct}
            />

            {comparison.rows.length > 0 ? (
              <View className="mx-4 mt-3 bg-card" style={{ borderRadius: 20, shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2, overflow: 'hidden' }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground">แบ่งตามหมวดหมู่</Text>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 1 }} className="text-muted-foreground">เรียงตามการเปลี่ยนแปลงมากที่สุด</Text>
                </View>
                {comparison.rows.map((row, i) => (
                  <CategoryCompareRow key={row.categoryId} row={row} isFirst={i === 0} />
                ))}
              </View>
            ) : (
              <View className="items-center py-20">
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground">ไม่มีข้อมูลรายจ่ายในช่วงที่เลือก</Text>
              </View>
            )}
          </ScrollView>
        )}

        {pickerOpen && (
          <MonthPickerModal
            visible={!!pickerOpen}
            title={pickerOpen === 'A' ? 'เลือกเดือน (ก่อน)' : 'เลือกเดือน (หลัง)'}
            options={monthOptions}
            selected={pickerOpen === 'A' ? monthA : monthB}
            onSelect={(m) => selectMonth(pickerOpen, m)}
            onClose={() => setPickerOpen(null)}
          />
        )}
      </View>
    </Modal>
  );
}

// ===== Sub-components =====

interface CompareRow {
  categoryId: string;
  category: Category | undefined;
  amountA: number;
  amountB: number;
  countA: number;
  countB: number;
  delta: number;
  deltaPct: number;
}

function MonthPill({ label, sublabel, color, onPress }: {
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-card"
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: color,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color, opacity: 0.85 }}>{sublabel}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15 }} className="text-foreground">{label}</Text>
        <Ionicons name="chevron-down" size={14} color="#A39685" />
      </View>
    </Pressable>
  );
}

function TotalsCard({ totalA, totalB, labelA, labelB, delta, deltaPct }: {
  totalA: number;
  totalB: number;
  labelA: string;
  labelB: string;
  delta: number;
  deltaPct: number;
}) {
  const isIncrease = delta > 0;
  const isDecrease = delta < 0;
  const deltaColor = isIncrease ? '#C65A4E' : isDecrease ? '#3E8B68' : '#A39685';
  const deltaIcon = isIncrease ? 'arrow-up' : isDecrease ? 'arrow-down' : 'remove';
  const deltaText = isIncrease ? 'เพิ่มขึ้น' : isDecrease ? 'ลดลง' : 'เท่าเดิม';

  return (
    <View className="mx-4 bg-card" style={{ borderRadius: 20, padding: 20, shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#8AC5C5' }}>{labelA}</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, fontVariant: ['tabular-nums'], letterSpacing: -0.5, marginTop: 2 }} className="text-foreground">
            {formatCurrency(totalA)}
          </Text>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 10 }} className="text-muted-foreground">บาท</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#E87A3D' }}>{labelB}</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, fontVariant: ['tabular-nums'], letterSpacing: -0.5, marginTop: 2 }} className="text-foreground">
            {formatCurrency(totalB)}
          </Text>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 10 }} className="text-muted-foreground">บาท</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(42,35,32,0.08)' }}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: deltaColor + '18', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name={deltaIcon} size={14} color={deltaColor} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: deltaColor }}>
            {deltaText} {formatCurrency(Math.abs(delta))} ({Math.abs(deltaPct).toFixed(1)}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

function CategoryCompareRow({ row, isFirst }: { row: CompareRow; isFirst: boolean }) {
  const cat = row.category;
  const catColor = cat?.color ?? '#D3CBC3';
  const catIcon = (cat?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap;
  const catName = cat?.name ?? 'อื่น ๆ';
  const isIncrease = row.delta > 0;
  const isDecrease = row.delta < 0;
  const deltaColor = isIncrease ? '#C65A4E' : isDecrease ? '#3E8B68' : '#A39685';
  const maxAmount = Math.max(row.amountA, row.amountB, 1);

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: isFirst ? 0 : 0.5, borderTopColor: 'rgba(42,35,32,0.06)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 32, height: 32, backgroundColor: catColor + '22', marginRight: 10 }}
        >
          <Ionicons name={catIcon} size={14} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground" numberOfLines={1}>{catName}</Text>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 10, marginTop: 1 }} className="text-muted-foreground">
            {row.countA} → {row.countB} รายการ
          </Text>
        </View>
        {row.delta !== 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: deltaColor + '15' }}>
            <Ionicons name={isIncrease ? 'arrow-up' : 'arrow-down'} size={11} color={deltaColor} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, fontVariant: ['tabular-nums'], color: deltaColor }}>
              {Math.abs(row.deltaPct).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      <View style={{ gap: 6, paddingLeft: 42 }}>
        <CompareBar label="ก่อน" amount={row.amountA} maxAmount={maxAmount} color="#8AC5C5" />
        <CompareBar label="หลัง" amount={row.amountB} maxAmount={maxAmount} color="#E87A3D" />
      </View>
    </View>
  );
}

function CompareBar({ label, amount, maxAmount, color }: { label: string; amount: number; maxAmount: number; color: string }) {
  const pct = amount > 0 ? (amount / maxAmount) * 100 : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 10, color, width: 28 }}>{label}</Text>
      <View className="bg-secondary" style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} />
      </View>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'right' }} className="text-foreground">
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

function MonthPickerModal({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean;
  title: string;
  options: MonthKey[];
  selected: MonthKey;
  onSelect: (m: MonthKey) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40 items-center justify-center">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-11/12 max-w-md bg-card rounded-2xl p-4 border border-border"
          style={{ maxHeight: '75%' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 17 }} className="text-foreground">{title}</Text>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#6B5F52" />
            </Pressable>
          </View>
          <ScrollView>
            {options.map((m) => {
              const isSelected = m.year === selected.year && m.month === selected.month;
              return (
                <Pressable
                  key={monthKeyStr(m)}
                  onPress={() => onSelect(m)}
                  className={`px-4 py-3 rounded-xl mb-1.5 flex-row items-center justify-between ${isSelected ? 'bg-primary' : 'bg-background border border-border'}`}
                >
                  <Text
                    className={isSelected ? 'text-primary-foreground' : 'text-foreground'}
                    style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }}
                  >
                    {monthLabel(m, true)}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
