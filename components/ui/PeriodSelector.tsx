import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { Period, PeriodType } from '@/types';
import {
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

const TYPE_LABEL: Record<PeriodType, string> = {
  week: '1 สัปดาห์',
  month: '1 เดือน',
  '6months': '6 เดือน',
  year: '1 ปี',
};

export function PeriodSelector({ period, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<PeriodType>(period.type);

  const handleOpen = () => {
    setDraftType(period.type);
    setOpen(true);
  };

  const handlePickType = (t: PeriodType) => {
    setDraftType(t);
    if (t !== 'month' && t !== 'week') {
      onChange(getCurrentPeriod(t));
      setOpen(false);
    }
  };

  const handlePickAnchor = (p: Period) => {
    onChange(p);
    setOpen(false);
  };

  const anchors = listRecentAnchors(draftType, draftType === 'month' ? 12 : 8);

  return (
    <View className={className}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => onChange(shiftPeriod(period, -1))} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#666" />
        </Pressable>
        <Pressable
          onPress={handleOpen}
          className="flex-row items-center px-3 py-1.5 rounded-lg bg-secondary/60"
        >
          <Text className="text-foreground font-bold text-lg">{formatPeriodLabel(period)}</Text>
          <Ionicons name="chevron-down" size={18} color="#666" style={{ marginLeft: 4 }} />
        </Pressable>
        <Pressable onPress={() => onChange(shiftPeriod(period, 1))} className="p-2">
          <Ionicons name="chevron-forward" size={24} color="#666" />
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
              {(Object.keys(TYPE_LABEL) as PeriodType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => handlePickType(t)}
                  className={`flex-1 py-2 rounded-lg items-center ${draftType === t ? 'bg-primary' : ''}`}
                >
                  <Text
                    className={`text-xs font-semibold ${draftType === t ? 'text-primary-foreground' : 'text-foreground'}`}
                  >
                    {TYPE_LABEL[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {draftType === 'month' && (
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

            {draftType === 'week' && (
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
