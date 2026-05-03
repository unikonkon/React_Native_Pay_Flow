import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getTransactionsByRange } from '@/lib/stores/db';
import { formatCurrency, formatDateThai } from '@/lib/utils/format';
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

function daysInMonth(m: MonthKey): number {
  // Day-0 of next month = last day of current month
  return new Date(m.year, m.month + 1, 0).getDate();
}

// Days that contribute to "spending so far" in the given month. For the
// current calendar month we only count elapsed days so the daily-rate
// reflects actual pace, not a future projection.
function spendingDays(m: MonthKey): number {
  const now = new Date();
  const isCurrent = m.year === now.getFullYear() && m.month === now.getMonth();
  if (isCurrent) return Math.max(1, now.getDate());
  return daysInMonth(m);
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
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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
    const byCatA = new Map<string, { amount: number; count: number; txs: Transaction[] }>();
    const byCatB = new Map<string, { amount: number; count: number; txs: Transaction[] }>();

    for (const tx of txsA) {
      const ex = byCatA.get(tx.categoryId);
      if (ex) { ex.amount += tx.amount; ex.count++; ex.txs.push(tx); }
      else byCatA.set(tx.categoryId, { amount: tx.amount, count: 1, txs: [tx] });
    }
    for (const tx of txsB) {
      const ex = byCatB.get(tx.categoryId);
      if (ex) { ex.amount += tx.amount; ex.count++; ex.txs.push(tx); }
      else byCatB.set(tx.categoryId, { amount: tx.amount, count: 1, txs: [tx] });
    }

    const totalA = txsA.reduce((s, t) => s + t.amount, 0);
    const totalB = txsB.reduce((s, t) => s + t.amount, 0);

    const sortByDateDesc = (arr: Transaction[]) =>
      [...arr].sort((p, q) => (q.date.localeCompare(p.date)) || q.createdAt.localeCompare(p.createdAt));

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
        transactionsA: a ? sortByDateDesc(a.txs) : [],
        transactionsB: b ? sortByDateDesc(b.txs) : [],
      };
    }).sort((x, y) => sortOrder === 'desc'
      ? Math.abs(y.delta) - Math.abs(x.delta)
      : Math.abs(x.delta) - Math.abs(y.delta)
    );

    return {
      totalA,
      totalB,
      totalDelta: totalB - totalA,
      totalDeltaPct: totalA > 0 ? ((totalB - totalA) / totalA) * 100 : 0,
      rows,
    };
  }, [txsA, txsB, categories, sortOrder]);

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
        <View className="bg-accent" style={{ paddingTop: 56, paddingBottom: 8, paddingHorizontal: 16 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center"
                style={{ width: 40, height: 40, backgroundColor: '#E87A3D22' }}
              >
                <Ionicons name="swap-horizontal" size={20} color="#E87A3D" />
              </View>
              <View className="ml-3 flex-1">
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16 }} className="text-foreground">เทียบรายจ่าย</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">เปรียบเทียบเดือนต่อเดือน</Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-full bg-card/80">
              <Ionicons name="close" size={22} className="text-muted-foreground" color="#A39685" />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#E87A3D" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <TotalsCard
              monthA={monthA}
              monthB={monthB}
              totalA={comparison.totalA}
              totalB={comparison.totalB}
              delta={comparison.totalDelta}
              deltaPct={comparison.totalDeltaPct}
              onPickA={() => { Haptics.selectionAsync(); setPickerOpen('A'); }}
              onPickB={() => { Haptics.selectionAsync(); setPickerOpen('B'); }}
            />

            {comparison.rows.length > 0 ? (
              <View className="mx-4 mt-3 bg-card" style={{ borderRadius: 20, shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2, overflow: 'hidden' }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground">แบ่งตามหมวดหมู่</Text>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 1 }} className="text-muted-foreground">
                      {sortOrder === 'desc' ? 'เปลี่ยนแปลงมากสุด → น้อยสุด' : 'เปลี่ยนแปลงน้อยสุด → มากสุด'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setSortOrder(o => o === 'desc' ? 'asc' : 'desc'); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: '#E87A3D18',
                    }}
                  >
                    <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={12} color="#E87A3D" />
                    <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11, color: '#E87A3D' }}>
                      {sortOrder === 'desc' ? 'มากสุด' : 'น้อยสุด'}
                    </Text>
                  </Pressable>
                </View>
                {comparison.rows.map((row, i) => (
                  <CategoryCompareRow
                    key={row.categoryId}
                    row={row}
                    isFirst={i === 0}
                    labelA={monthLabel(monthA)}
                    labelB={monthLabel(monthB)}
                  />
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
  transactionsA: Transaction[];
  transactionsB: Transaction[];
}

function MonthChip({ sublabel, label, color, align, onPress }: {
  sublabel: string;
  label: string;
  color: string;
  align: 'flex-start' | 'flex-end';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1, borderColor: color,
        backgroundColor: color + '14',
        alignSelf: align,
        opacity: pressed ? 0.7 : 1,
      })}
      hitSlop={6}
    >
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11, color }}>
        {sublabel} · {label}
      </Text>
      <Ionicons name="chevron-down" size={11} color={color} />
    </Pressable>
  );
}

function TotalsCard({ monthA, monthB, totalA, totalB, delta, deltaPct, onPickA, onPickB }: {
  monthA: MonthKey;
  monthB: MonthKey;
  totalA: number;
  totalB: number;
  delta: number;
  deltaPct: number;
  onPickA: () => void;
  onPickB: () => void;
}) {
  const isIncrease = delta > 0;
  const isDecrease = delta < 0;
  const deltaColor = isIncrease ? '#C65A4E' : isDecrease ? '#3E8B68' : '#A39685';
  const deltaIcon = isIncrease ? 'arrow-up' : isDecrease ? 'arrow-down' : 'remove';
  const deltaText = isIncrease ? 'เพิ่มขึ้น' : isDecrease ? 'ลดลง' : 'เท่าเดิม';

  const daysA = spendingDays(monthA);
  const daysB = spendingDays(monthB);
  const dailyA = daysA > 0 ? totalA / daysA : 0;
  const dailyB = daysB > 0 ? totalB / daysB : 0;

  return (
    <View
      className="mx-4 bg-card"
      style={{
        borderRadius: 20, padding: 18,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        {/* Side A — left aligned */}
        <View style={{ flex: 1, gap: 6 }}>
          <MonthChip
            sublabel="ก่อนหน้า"
            label={monthLabel(monthA)}
            color="#8AC5C5"
            align="flex-start"
            onPress={onPickA}
          />
          <Text
            style={{
              fontFamily: 'Inter_700Bold', fontSize: 22, fontVariant: ['tabular-nums'],
              letterSpacing: -0.5,
            }}
            className="text-foreground"
          >
            {formatCurrency(totalA)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="calendar-outline" size={11} color="#A39685" />
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold', fontSize: 11, fontVariant: ['tabular-nums'],
              }}
              className="text-muted-foreground"
            >
              {formatCurrency(dailyA)}/วัน
            </Text>
          </View>
        </View>

        {/* Side B — right aligned */}
        <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
          <MonthChip
            sublabel="ปัจจุบัน"
            label={monthLabel(monthB)}
            color="#E87A3D"
            align="flex-end"
            onPress={onPickB}
          />
          <Text
            style={{
              fontFamily: 'Inter_700Bold', fontSize: 22, fontVariant: ['tabular-nums'],
              letterSpacing: -0.5,
            }}
            className="text-foreground"
          >
            {formatCurrency(totalB)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="calendar-outline" size={11} color="#A39685" />
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold', fontSize: 11, fontVariant: ['tabular-nums'],
              }}
              className="text-muted-foreground"
            >
              {formatCurrency(dailyB)}/วัน
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          marginTop: 14, paddingTop: 12,
          borderTopWidth: 0.5, borderTopColor: 'rgba(42,35,32,0.08)',
        }}
      >
        <View
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
            backgroundColor: deltaColor + '18',
            flexDirection: 'row', alignItems: 'center', gap: 4,
          }}
        >
          <Ionicons name={deltaIcon} size={14} color={deltaColor} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: deltaColor }}>
            {deltaText} {formatCurrency(Math.abs(delta))} ({Math.abs(deltaPct).toFixed(1)}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

function CategoryCompareRow({ row, isFirst, labelA, labelB }: { row: CompareRow; isFirst: boolean; labelA: string; labelB: string }) {
  const cat = row.category;
  const catColor = cat?.color ?? '#D3CBC3';
  const catIcon = (cat?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap;
  const catName = cat?.name ?? 'อื่น ๆ';
  const isIncrease = row.delta > 0;
  const isDecrease = row.delta < 0;
  const deltaColor = isIncrease ? '#C65A4E' : isDecrease ? '#3E8B68' : '#A39685';
  const maxAmount = Math.max(row.amountA, row.amountB, 1);
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="border-b border-border py-2 px-4">
      <Pressable
        onPress={() => { Haptics.selectionAsync(); setExpanded(e => !e); }}
        style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 12, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ marginRight: 10 }}>
            <CatCategoryIcon
              kind={catIcon}
              size={32}
              bg={catColor + '22'}
              strokeColor={catColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground" numberOfLines={1}>{catName}</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 10, marginTop: 1 }} className="text-muted-foreground">
              {row.countA} → {row.countB} รายการ
            </Text>
          </View>
          {row.delta !== 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: deltaColor + '15', marginRight: 6 }}>
              <Ionicons name={isIncrease ? 'arrow-up' : 'arrow-down'} size={11} color={deltaColor} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, fontVariant: ['tabular-nums'], color: deltaColor }}>
                {formatCurrency(Math.abs(row.delta))}
              </Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, fontVariant: ['tabular-nums'], color: deltaColor, opacity: 0.75 }}>
                ({Math.abs(row.deltaPct).toFixed(0)}%)
              </Text>
            </View>
          )}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#A39685" />
        </View>

        <View style={{ gap: 6, paddingLeft: 42 }}>
          <CompareBar label="ก่อน" amount={row.amountA} maxAmount={maxAmount} color="#8AC5C5" />
          <CompareBar label="หลัง" amount={row.amountB} maxAmount={maxAmount} color="#E87A3D" />
        </View>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingLeft: 42 }}>
          <TxGroup label={labelA} sublabel="ก่อน" color="#8AC5C5" txs={row.transactionsA} />
          <TxGroup label={labelB} sublabel="หลัง" color="#E87A3D" txs={row.transactionsB} />
        </View>
      )}
    </View>
  );
}

function TxGroup({ label, sublabel, color, txs }: { label: string; sublabel: string; color: string; txs: Transaction[] }) {
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11, color }}>{sublabel}</Text>
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-muted-foreground">· {label}</Text>
      </View>
      {txs.length === 0 ? (
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, paddingLeft: 12 }} className="text-muted-foreground">ไม่มีรายการ</Text>
      ) : (
        txs.map(tx => (
          <View
            key={tx.id}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingLeft: 12, gap: 8 }}
          >
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, minWidth: 56 }} className="text-muted-foreground">
              {formatDateThai(tx.date)}
            </Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, flex: 1 }} className="text-foreground" numberOfLines={1}>
              {tx.note?.trim() || '—'}
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, fontVariant: ['tabular-nums'] }} className="text-foreground">
              {formatCurrency(tx.amount)}
            </Text>
          </View>
        ))
      )}
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
  const years = useMemo(
    () => Array.from(new Set(options.map(o => o.year))).sort((a, b) => b - a),
    [options],
  );
  const validKeys = useMemo(() => new Set(options.map(o => monthKeyStr(o))), [options]);

  const [tempYear, setTempYear] = useState(selected.year);

  useEffect(() => {
    if (visible) setTempYear(selected.year);
  }, [visible, selected.year]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40 items-center justify-center">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-11/12 max-w-md bg-card rounded-2xl p-4 border border-border"
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 17 }} className="text-foreground">{title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {options.length > 0 && (
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); onSelect(options[0]); }}
                    hitSlop={6}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: pressed ? '#E87A3D33' : '#E87A3D18',
                    })}
                    accessibilityRole="button"
                    accessibilityLabel="ไปเดือนล่าสุด"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} className="rounded-full border border-border px-2 py-1">
                      <Ionicons name="time-outline" size={13} color="#E87A3D" />
                      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#E87A3D' }}>
                        เดือนล่าสุด
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>

            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#6B5F52" />
            </Pressable>
          </View>

          {/* Year chips */}
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, marginBottom: 6 }} className="text-muted-foreground">ปี</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8, gap: 8 }}
            style={{ marginBottom: 14 }}
          >
            {years.map((y) => {
              const isActive = y === tempYear;
              return (
                <Pressable
                  key={y}
                  onPress={() => { Haptics.selectionAsync(); setTempYear(y); }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: isActive ? '#E87A3D' : 'transparent',
                    borderWidth: 1,
                    borderColor: isActive ? '#E87A3D' : '#E5DDD3',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'IBMPlexSansThai_600SemiBold',
                      fontSize: 13,
                    }}
                    className={isActive ? 'text-white' : 'text-foreground'}
                  >
                    {y + 543}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Month grid 3 × 4 */}
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, marginBottom: 6 }} className="text-muted-foreground">เดือน</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: 12 }, (_, m) => {
              const isSelected = tempYear === selected.year && m === selected.month;
              const key: MonthKey = { year: tempYear, month: m };
              const enabled = validKeys.has(monthKeyStr(key));
              return (
                <View key={m} style={{ width: '33.333%', padding: 4 }}>
                  <Pressable
                    onPress={() => { if (enabled) onSelect(key); }}
                    disabled={!enabled}
                    style={({ pressed }) => ({
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#E87A3D' : enabled ? '#E5DDD3' : '#F0EAE2',
                      backgroundColor: isSelected ? '#E87A3D' : 'transparent',
                      opacity: !enabled ? 0.4 : pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: 'IBMPlexSansThai_600SemiBold',
                        fontSize: 14,
                      }}
                      className={isSelected ? 'text-foreground' : enabled ? 'text-foreground' : 'text-muted-foreground'}
                    >
                      {THAI_MONTHS_FULL[m]}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
