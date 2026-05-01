import { THAI_MONTHS, THAI_MONTHS_FULL } from '@/lib/utils/format';
import {
  canShiftPeriod,
  createCustomPeriod,
  formatPeriodLabel,
  getCurrentPeriod,
  getMonthGrid,
  getPeriodRange,
  shiftPeriod,
} from '@/lib/utils/period';
import { useIsDarkTheme } from '@/lib/utils/theme';
import type { Period, PeriodType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
  period: Period;
  onChange: (p: Period) => void;
  className?: string;
}

type PresetType = Extract<
  PeriodType,
  'week' | 'month' | '2months' | '3months' | '4months' | '6months' | 'year' | '2years' | 'all'
>;

const PRESETS: { type: PresetType; label: string }[] = [
  { type: 'week', label: 'สัปดาห์นี้' },
  { type: 'month', label: 'เดือนนี้' },
  { type: '2months', label: '2 เดือน' },
  { type: '3months', label: '3 เดือน' },
  { type: '4months', label: '4 เดือน' },
  { type: '6months', label: '6 เดือน' },
  { type: 'year', label: '1 ปี' },
  { type: '2years', label: '2 ปี' },
  { type: 'all', label: 'ทั้งหมด' },
];

const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const stripTime = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const formatShortThai = (d: Date) => {
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${yy}`;
};

export function PeriodSelector({ period, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const isDark = useIsDarkTheme();
  const chevronActive = isDark ? '#A39685' : '#6B5F52';
  const chevronDisabled = isDark ? '#4A3D30' : '#D3CBC3';

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const r = getPeriodRange(period);
    return stripTime(new Date(r.start));
  });
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [pendingEnd, setPendingEnd] = useState<Date | null>(null);

  const handleOpen = () => {
    const r = getPeriodRange(period);
    const s = stripTime(new Date(r.start));
    const e = stripTime(new Date(r.end));
    setPendingStart(s);
    setPendingEnd(e);
    setViewMonth(new Date(s.getFullYear(), s.getMonth(), 1));
    setOpen(true);
  };

  const handlePickPreset = (t: PresetType) => {
    Haptics.selectionAsync();
    onChange(getCurrentPeriod(t));
    setOpen(false);
  };

  const handleShiftMonth = (dir: -1 | 1) => {
    Haptics.selectionAsync();
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1));
  };

  const handleTapDay = (d: Date) => {
    if (!sameMonth(d, viewMonth)) return;
    Haptics.selectionAsync();
    if (pendingStart === null) {
      setPendingStart(d);
      setPendingEnd(null);
      return;
    }
    if (pendingEnd === null) {
      if (d < pendingStart) {
        setPendingEnd(pendingStart);
        setPendingStart(d);
      } else {
        setPendingEnd(d);
      }
      return;
    }
    setPendingStart(d);
    setPendingEnd(null);
  };

  const handleApply = () => {
    if (!pendingStart) return;
    const start = pendingStart;
    const end = pendingEnd ?? pendingStart;
    Haptics.selectionAsync();
    onChange(createCustomPeriod(toISO(start), toISO(end)));
    setOpen(false);
  };

  const handleReset = () => {
    Haptics.selectionAsync();
    setPendingStart(null);
    setPendingEnd(null);
  };

  const handleToday = () => {
    Haptics.selectionAsync();
    const today = stripTime(new Date());
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    if (pendingStart === null) {
      // No start yet — make today the (single-day) range
      setPendingStart(today);
      setPendingEnd(today);
      return;
    }
    // Start exists — set today as the end (swap if today is before start)
    if (today < pendingStart) {
      setPendingEnd(pendingStart);
      setPendingStart(today);
    } else {
      setPendingEnd(today);
    }
  };

  const selectionStep: 'start' | 'end' | 'done' =
    pendingStart === null ? 'start' : pendingEnd === null ? 'end' : 'done';

  const stepColor =
    selectionStep === 'start'
      ? isDark ? '#A39685' : '#6B5F52'
      : selectionStep === 'end'
      ? '#E87A3D'
      : isDark ? '#F5EFE7' : '#2B2118';

  const stepLabel = (() => {
    if (selectionStep === 'start') return 'เลือกวันที่เริ่มต้น';
    if (selectionStep === 'end') {
      return `เริ่ม ${formatShortThai(pendingStart!)} → เลือกวันที่สุดท้าย`;
    }
    return `${formatShortThai(pendingStart!)} → ${formatShortThai(pendingEnd!)}`;
  })();

  const canShift = canShiftPeriod(period);

  return (
    <View className={className}>
      <View className="flex-row items-center justify-between rounded-full bg-background border border-border">
        <Pressable
          onPress={() => { if (canShift) { Haptics.selectionAsync(); onChange(shiftPeriod(period, -1)); } }}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-back" size={24} color={canShift ? chevronActive : chevronDisabled} />
        </Pressable>
        <Pressable
          onPress={handleOpen}
          className="w-full flex-row items-center justify-center px-3.5 py-1.5 gap-2 flex-shrink"
        >
          <Ionicons name="calendar-outline" size={16} color="#A39685" style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 16 }} className="text-foreground" numberOfLines={1}>
            {formatPeriodLabel(period)}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#A39685" style={{ marginLeft: 4 }} />
        </Pressable>
        <Pressable
          onPress={() => { if (canShift) { Haptics.selectionAsync(); onChange(shiftPeriod(period, 1)); } }}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-forward" size={24} color={canShift ? chevronActive : chevronDisabled} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/40 items-center justify-center"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-11/12 max-w-md bg-background rounded-2xl p-4 border border-border"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">
                เลือกช่วงเวลา
              </Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#A39685" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ paddingRight: 8 }}
            >
              {PRESETS.map((p) => {
                const active = period.type === p.type;
                return (
                  <Pressable
                    key={p.type}
                    onPress={() => handlePickPreset(p.type)}
                    className="px-4 py-2 rounded-full mr-2 border"
                    style={{
                      backgroundColor: active ? '#E87A3D' : 'transparent',
                      borderColor: active ? '#E87A3D' : isDark ? '#4A3D30' : '#E5DDD3',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'IBMPlexSansThai_600SemiBold',
                        fontSize: 12,
                        color: active ? '#fff' : isDark ? '#E87A3D' : '#2B2118',
                      }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View
              className="flex-row items-center justify-between rounded-xl px-3 py-2 mb-3 border"
              style={{
                borderColor: selectionStep === 'end' ? '#E87A3D' : isDark ? '#4A3D30' : '#E5DDD3',
                backgroundColor:
                  selectionStep === 'end'
                    ? isDark
                      ? 'rgba(232,122,61,0.12)'
                      : 'rgba(232,122,61,0.08)'
                    : 'transparent',
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'IBMPlexSansThai_600SemiBold',
                  fontSize: 11,
                  color: stepColor,
                  flex: 1,
                  marginRight: 8,
                }}
              >
                {stepLabel}
              </Text>
              <Pressable
                onPress={handleToday}
                hitSlop={6}
                className="flex-row items-center px-2 py-1 mr-1 border border-border rounded-lg"
              >
                <Ionicons
                  name="today-outline"
                  size={14}
                  color="#E87A3D"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontFamily: 'IBMPlexSansThai_600SemiBold',
                    fontSize: 12,
                    color: '#E87A3D',
                  }}
                >
                  วันนี้
                </Text>
              </Pressable>
              <Pressable
                onPress={handleReset}
                disabled={pendingStart === null}
                hitSlop={6}
                className="flex-row items-center px-2 py-1 border border-border rounded-lg"
                style={{ opacity: pendingStart === null ? 0.4 : 1 }}
              >
                <Ionicons
                  name="refresh"
                  size={14}
                  color={isDark ? '#A39685' : '#6B5F52'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontFamily: 'IBMPlexSansThai_600SemiBold',
                    fontSize: 12,
                    color: isDark ? '#A39685' : '#6B5F52',
                  }}
                >
                  ล้าง
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <Pressable onPress={() => handleShiftMonth(-1)} className="p-2">
                <Ionicons name="chevron-back" size={20} color={chevronActive} />
              </Pressable>
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16 }} className="text-foreground">
                {THAI_MONTHS_FULL[viewMonth.getMonth()]} {viewMonth.getFullYear() + 543}
              </Text>
              <Pressable onPress={() => handleShiftMonth(1)} className="p-2">
                <Ionicons name="chevron-forward" size={20} color={chevronActive} />
              </Pressable>
            </View>

            <View className="flex-row mb-1">
              {WEEKDAYS.map((w) => (
                <View key={w} className="flex-1 items-center py-1">
                  <Text
                    style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11 }}
                    className="text-muted-foreground"
                  >
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            <CalendarGrid
              viewMonth={viewMonth}
              pendingStart={pendingStart}
              pendingEnd={pendingEnd}
              onTapDay={handleTapDay}
              isDark={isDark}
            />

            <Pressable
              onPress={handleApply}
              disabled={pendingStart === null}
              className="py-3 rounded-full items-center mt-4"
              style={{
                backgroundColor: pendingStart === null ? (isDark ? '#3A2F25' : '#E5DDD3') : '#E87A3D',
              }}
            >
              <Text
                style={{
                  fontFamily: 'IBMPlexSansThai_700Bold',
                  fontSize: 14,
                  color: pendingStart === null ? (isDark ? '#6B5F52' : '#A39685') : '#fff',
                }}
              >
                ใช้ช่วงเวลานี้
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface CalendarGridProps {
  viewMonth: Date;
  pendingStart: Date | null;
  pendingEnd: Date | null;
  onTapDay: (d: Date) => void;
  isDark: boolean;
}

function CalendarGrid({ viewMonth, pendingStart, pendingEnd, onTapDay, isDark }: CalendarGridProps) {
  const grid = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);
  const today = useMemo(() => stripTime(new Date()), []);
  const rangeStart = pendingStart;
  const rangeEnd = pendingEnd ?? pendingStart;

  return (
    <View>
      {Array.from({ length: 6 }).map((_, row) => (
        <View key={row} className="flex-row">
          {grid.slice(row * 7, row * 7 + 7).map((d) => {
            const inMonth = sameMonth(d, viewMonth);
            const isStart = rangeStart !== null && sameDay(d, rangeStart);
            const isEnd = rangeEnd !== null && sameDay(d, rangeEnd);
            const inRange =
              rangeStart !== null && rangeEnd !== null && d > rangeStart && d < rangeEnd;
            const isToday = sameDay(d, today);

            let bg: string | undefined;
            if (isStart || isEnd) bg = '#E87A3D';
            else if (inRange) bg = isDark ? 'rgba(232,122,61,0.25)' : 'rgba(232,122,61,0.18)';

            let textColor: string;
            if (isStart || isEnd) textColor = '#fff';
            else if (!inMonth) textColor = isDark ? '#4A3D30' : '#C8BFB5';
            else textColor = isDark ? '#F5EFE7' : '#2B2118';

            const isSingleDay = isStart && isEnd;
            const radiusStyle = isSingleDay
              ? { borderRadius: 999 }
              : isStart
              ? {
                  borderTopLeftRadius: 999,
                  borderBottomLeftRadius: 999,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : isEnd
              ? {
                  borderTopRightRadius: 999,
                  borderBottomRightRadius: 999,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }
              : { borderRadius: 0 };

            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => onTapDay(d)}
                disabled={!inMonth}
                className="flex-1 items-center justify-center"
                style={{
                  height: 40,
                  backgroundColor: bg,
                  ...radiusStyle,
                  borderWidth: isToday && !(isStart || isEnd) ? 1 : 0,
                  borderColor: '#E87A3D',
                }}
              >
                <Text
                  style={{
                    fontFamily:
                      isStart || isEnd || isToday
                        ? 'IBMPlexSansThai_700Bold'
                        : 'IBMPlexSansThai_500Medium',
                    fontSize: 14,
                    color: textColor,
                  }}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
