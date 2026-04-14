import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { Period, PeriodType } from '@/types';
import {
  canShiftPeriod,
  formatPeriodLabel,
  getCurrentPeriod,
  listRecentAnchors,
  periodsEqual,
  shiftPeriod,
} from '@/lib/utils/period';

interface Props {
  period: Period;
  onChange: (p: Period) => void;
  className?: string;
}

type TabKey = 'week' | 'month' | 'long';

const TAB_LABEL: Record<TabKey, string> = {
  week: '1 สัปดาห์',
  month: '1 เดือน',
  long: 'สรุปยาว',
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
  return 'long';
}

export function PeriodSelector({ period, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>(tabFromType(period.type));

  const handleOpen = () => {
    setTab(tabFromType(period.type));
    setOpen(true);
  };

  const handlePickType = (t: PeriodType) => {
    onChange(getCurrentPeriod(t));
    setOpen(false);
  };

  const handlePickAnchor = (p: Period) => {
    onChange(p);
    setOpen(false);
  };

  const anchors = useMemo(() => {
    if (tab === 'month') return listRecentAnchors('month', 12);
    if (tab === 'week') return listRecentAnchors('week', 8);
    return [];
  }, [tab]);

  const canShift = canShiftPeriod(period);

  return (
    <View className={className}>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => canShift && onChange(shiftPeriod(period, -1))}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-back" size={24} color={canShift ? '#666' : '#ccc'} />
        </Pressable>
        <Pressable
          onPress={handleOpen}
          className="flex-row items-center px-3 py-1.5 rounded-lg bg-secondary/60 flex-shrink"
        >
          <Text className="text-foreground font-bold text-lg" numberOfLines={1}>
            {formatPeriodLabel(period)}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#666" style={{ marginLeft: 4 }} />
        </Pressable>
        <Pressable
          onPress={() => canShift && onChange(shiftPeriod(period, 1))}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-forward" size={24} color={canShift ? '#666' : '#ccc'} />
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
                <Ionicons name="close" size={22} color="#666" />
              </Pressable>
            </View>

            <View className="flex-row bg-secondary rounded-xl p-1 mb-4">
              {(Object.keys(TAB_LABEL) as TabKey[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg items-center ${tab === t ? 'bg-primary' : ''}`}
                >
                  <Text
                    className={`text-xs font-semibold ${tab === t ? 'text-primary-foreground' : 'text-foreground'}`}
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
                          className={`px-2 py-3 rounded-xl border items-center ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
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
                      className={`px-3 py-3 rounded-xl mb-2 border ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
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
                      className={`px-4 py-3 rounded-xl mb-2 border flex-row items-center justify-between ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
