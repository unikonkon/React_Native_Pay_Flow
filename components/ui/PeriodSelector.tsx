import {
  canShiftPeriod,
  createCustomPeriod,
  formatPeriodLabel,
  getCurrentPeriod,
  listRecentAnchors,
  periodsEqual,
  shiftPeriod,
} from '@/lib/utils/period';
import type { Period, PeriodType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
  period: Period;
  onChange: (p: Period) => void;
  className?: string;
}

type TabKey = 'week' | 'month' | 'long' | 'custom';

const TAB_LABEL: Record<TabKey, string> = {
  week: 'สัปดาห์',
  month: 'เดือน',
  long: 'สรุปยาว',
  custom: 'กำหนดเอง',
};

const LONG_OPTIONS: { type: Extract<PeriodType, '3months' | '6months' | 'year' | 'all'>; label: string }[] = [
  { type: '3months', label: '3 เดือน' },
  { type: '6months', label: '6 เดือน' },
  { type: 'year', label: '1 ปี' },
  { type: 'all', label: 'ทั้งหมด' },
];

function tabFromType(type: PeriodType): TabKey {
  if (type === 'week') return 'week';
  if (type === 'month') return 'month';
  if (type === 'custom') return 'custom';
  return 'long';
}

export function PeriodSelector({ period, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>(tabFromType(period.type));

  // Custom date range state
  const [customStart, setCustomStart] = useState(() => {
    if (period.type === 'custom') return new Date(period.anchor);
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [customEnd, setCustomEnd] = useState(() => {
    if (period.type === 'custom' && period.endDate) return new Date(period.endDate);
    return new Date();
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleOpen = () => {
    setTab(tabFromType(period.type));
    if (period.type === 'custom') {
      setCustomStart(new Date(period.anchor));
      if (period.endDate) setCustomEnd(new Date(period.endDate));
    }
    setOpen(true);
  };

  const handlePickType = (t: PeriodType) => {
    Haptics.selectionAsync();
    onChange(getCurrentPeriod(t));
    setOpen(false);
  };

  const handlePickAnchor = (p: Period) => {
    Haptics.selectionAsync();
    onChange(p);
    setOpen(false);
  };

  const handleApplyCustom = () => {
    Haptics.selectionAsync();
    const toISO = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const start = customStart <= customEnd ? customStart : customEnd;
    const end = customStart <= customEnd ? customEnd : customStart;
    onChange(createCustomPeriod(toISO(start), toISO(end)));
    setOpen(false);
  };

  const anchors = useMemo(() => {
    if (tab === 'month') return listRecentAnchors('month', 12);
    if (tab === 'week') return listRecentAnchors('week', 8);
    return [];
  }, [tab]);

  const canShift = canShiftPeriod(period);

  const formatThaiDate = (d: Date) => {
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <View className={className}>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => { if (canShift) { Haptics.selectionAsync(); onChange(shiftPeriod(period, -1)); } }}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-back" size={24} color={canShift ? '#666' : '#A39685'} />
        </Pressable>
        <Pressable
          onPress={handleOpen}
          className="flex-row items-center px-3 py-1.5 rounded-xl bg-secondary/60 flex-shrink"
        >
          <Text className="text-foreground font-bold text-lg" numberOfLines={1}>
            {formatPeriodLabel(period)}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#6B5F52" style={{ marginLeft: 4 }} />
        </Pressable>
        <Pressable
          onPress={() => { if (canShift) { Haptics.selectionAsync(); onChange(shiftPeriod(period, 1)); } }}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-forward" size={24} color={canShift ? '#666' : '#A39685'} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/40 items-center justify-center"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-11/12 max-w-md bg-card rounded-2xl p-4 border border-border"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-lg">เลือกช่วงเวลา</Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#6B5F52" />
              </Pressable>
            </View>

            <View className="flex-row bg-secondary rounded-2xl p-1 mb-4">
              {(Object.keys(TAB_LABEL) as TabKey[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { Haptics.selectionAsync(); setTab(t); }}
                  className={`flex-1 py-2 rounded-xl items-center ${tab === t ? 'bg-primary' : ''}`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${tab === t ? 'text-primary-foreground' : 'text-foreground'}`}
                  >
                    {TAB_LABEL[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'month' && (
              <ScrollView className="max-h-80">
                <View className="flex-row flex-wrap -mx-1">
                  {anchors.map((p, i) => {
                    const selected = periodsEqual(p, period);
                    const isLatest = i === 0;
                    return (
                      <View key={p.anchor} className="w-1/3 p-1">
                        <Pressable
                          onPress={() => handlePickAnchor(p)}
                          className={`px-2 py-3 rounded-2xl border items-center ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
                        >
                          <Text
                            className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
                            numberOfLines={1}
                          >
                            {formatPeriodLabel(p)}
                          </Text>
                          {isLatest && (
                            <Text
                              className={`text-[10px] mt-0.5 ${selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                            >
                              เดือนล่าสุด
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {tab === 'week' && (
              <ScrollView className="max-h-80">
                {anchors.map((p, i) => {
                  const selected = periodsEqual(p, period);
                  return (
                    <Pressable
                      key={p.anchor}
                      onPress={() => handlePickAnchor(p)}
                      className={`px-3 py-3 rounded-2xl mb-2 border ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
                    >
                      <Text
                        className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
                      >
                        {formatPeriodLabel(p)}
                        {i === 0 ? '  (สัปดาห์นี้)' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {tab === 'long' && (
              <View>
                {LONG_OPTIONS.map((opt) => {
                  const selected = period.type === opt.type;
                  return (
                    <Pressable
                      key={opt.type}
                      onPress={() => handlePickType(opt.type)}
                      className={`px-4 py-3 rounded-2xl mb-2 border flex-row items-center justify-between ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
                    >
                      <Text
                        className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
                      >
                        {opt.label}
                      </Text>
                      {selected && (
                        <Ionicons name="checkmark" size={18} color="white" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {tab === 'custom' && (
              <View>
                {/* Start Date */}
                {showStartPicker ? (
                  <View className="bg-white rounded-2xl mb-2 overflow-hidden">
                    <View className="px-4 pt-2">
                      <Text className="text-gray-500 text-xs font-semibold">วันเริ่มต้น</Text>
                    </View>
                    <DateTimePicker
                      value={customStart}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={customEnd}
                      onChange={(_, date) => {
                        if (Platform.OS === 'android') setShowStartPicker(false);
                        if (date) setCustomStart(date);
                      }}
                      locale="th"
                      themeVariant="light"
                    />
                    {Platform.OS === 'ios' && (
                      <Pressable onPress={() => setShowStartPicker(false)} className="py-2 items-center">
                        <Text className="text-primary font-semibold text-sm">ตกลง</Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <Pressable
                    onPress={() => { setShowStartPicker(true); setShowEndPicker(false); }}
                    className="px-4 py-3 rounded-2xl mb-2 border border-border bg-background flex-row items-center justify-between"
                  >
                    <Text className="text-muted-foreground text-sm">วันเริ่มต้น</Text>
                    <Text className="text-foreground font-semibold text-sm">{formatThaiDate(customStart)}</Text>
                  </Pressable>
                )}

                {/* End Date */}
                {showEndPicker ? (
                  <View className="bg-white rounded-2xl mb-2 overflow-hidden">
                    <View className="px-4 pt-2">
                      <Text className="text-gray-500 text-xs font-semibold">วันสิ้นสุด</Text>
                    </View>
                    <DateTimePicker
                      value={customEnd}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      minimumDate={customStart}
                      onChange={(_, date) => {
                        if (Platform.OS === 'android') setShowEndPicker(false);
                        if (date) setCustomEnd(date);
                      }}
                      locale="th"
                      themeVariant="light"
                    />
                    {Platform.OS === 'ios' && (
                      <Pressable onPress={() => setShowEndPicker(false)} className="py-2 items-center">
                        <Text className="text-primary font-semibold text-sm">ตกลง</Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <Pressable
                    onPress={() => { setShowEndPicker(true); setShowStartPicker(false); }}
                    className="px-4 py-3 rounded-2xl mb-2 border border-border bg-background flex-row items-center justify-between"
                  >
                    <Text className="text-muted-foreground text-sm">วันสิ้นสุด</Text>
                    <Text className="text-foreground font-semibold text-sm">{formatThaiDate(customEnd)}</Text>
                  </Pressable>
                )}

                {/* Apply Button */}
                <Pressable
                  onPress={handleApplyCustom}
                  className="bg-primary py-3 rounded-full items-center mt-2"
                >
                  <Text className="text-primary-foreground font-bold text-sm">ใช้ช่วงเวลานี้</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
