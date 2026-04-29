import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { formatCurrency } from '@/lib/utils/format';
import type { Category, CategorySummary, Period } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { AllTransactionsCalendarModal } from './AllTransactionsCalendarModal';
import { CategoryCalendarModal } from './CategoryCalendarModal';
import { CompareExpensesModal } from './CompareExpensesModal';

interface PieChartViewProps {
  data: CategorySummary[];
  title: string;
  minPercentage?: number;
  period?: Period;
  walletId?: string | null;
  viewType?: 'expense' | 'income' | 'all';
  /** When `viewType === 'all'`, this is the net (income - expense) shown in the donut center
   * with a +/- prefix and color. If undefined, the chart falls back to the sum of `data`. */
  netAmount?: number;
}

const CHART_SIZE = 220;
const STROKE_WIDTH = 38;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Distinct palette for segments without a custom category color
const FALLBACK_PALETTE = [
  '#E8A24D', '#6BA87A', '#D08BA8', '#8B9BD4',
  '#C2915C', '#6FB3B8', '#B586C5', '#E8836E',
  '#9BB07A', '#D48F6A',
];

export function PieChartView({ data, title, minPercentage = 0, period, walletId, viewType, netAmount }: PieChartViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  if (data.length === 0) {
    return (
      <View className="items-center py-10">
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground">ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  // Color map keyed by categoryId — uses category.color if set, otherwise picks from
  // FALLBACK_PALETTE by original data index so small (<3%) segments without a custom
  // color still get distinct, non-repeating shades. Shared between donut and list.
  const colorByCategoryId = new Map<string, string>();
  data.forEach((item, i) => {
    colorByCategoryId.set(
      item.categoryId,
      item.category?.color ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
    );
  });
  const colorFor = (item: CategorySummary) => colorByCategoryId.get(item.categoryId) ?? '#D3CBC3';

  // Build donut segments
  const segments = data.slice(0, 8).map((item) => ({
    color: colorFor(item),
    fraction: total > 0 ? item.total / total : 0,
    icon: (item.category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap,
    categoryId: item.categoryId,
    name: item.category?.name ?? 'อื่น ๆ',
  }));

  // Calculate stroke offsets + label position (mid-angle on the ring) for each segment
  const NAME_RADIUS = CHART_SIZE / 2 + 6; // just outside the outer ring edge
  let accumulated = 0;
  const arcs = segments.map((seg) => {
    const offset = accumulated;
    const midFrac = offset + seg.fraction / 2;
    accumulated += seg.fraction;
    const angle = midFrac * 2 * Math.PI;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    return {
      color: seg.color,
      icon: seg.icon,
      categoryId: seg.categoryId,
      name: seg.name,
      fraction: seg.fraction,
      strokeDasharray: `${seg.fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      strokeDashoffset: -offset * CIRCUMFERENCE,
      labelX: CHART_SIZE / 2 + RADIUS * sinA,
      labelY: CHART_SIZE / 2 - RADIUS * cosA,
      nameX: CHART_SIZE / 2 + NAME_RADIUS * sinA,
      nameY: CHART_SIZE / 2 - NAME_RADIUS * cosA,
      sinA,
    };
  });

  const filtered = data.filter(item => item.percentage >= minPercentage);

  return (
    <View className="mb-2">
      {/* Donut card */}
      <View className="bg-card mx-4 mb-4" style={{
        padding: 20, paddingHorizontal: 16, paddingBottom: 16, borderRadius: 24,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: CHART_SIZE, height: CHART_SIZE, position: 'relative', overflow: 'visible' }}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
              {/* Background ring */}
              <Circle
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#F5EEE0"
                strokeWidth={STROKE_WIDTH}
              />
              {/* Segments */}
              <G rotation={-90} origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}>
                {arcs.map((arc, i) => (
                  <Circle
                    key={i}
                    cx={CHART_SIZE / 2}
                    cy={CHART_SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    strokeLinecap="butt"
                  />
                ))}
              </G>
            </Svg>
            {/* Segment labels (categories > 3%) */}
            {arcs.filter(a => a.fraction > 0.03).map((arc) => (
              <View
                key={arc.categoryId}
                pointerEvents="none"
                className="bg-card"
                style={{
                  position: 'absolute',
                  left: arc.labelX - 13,
                  top: arc.labelY - 13,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#2A2320',
                  shadowOpacity: 0.12,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                }}
              >
                <CatCategoryIcon kind={arc.icon} size={20} strokeColor={arc.color} bare />
              </View>
            ))}
            {/* Segment name labels (outside the ring) */}
            {arcs.filter(a => a.fraction > 0.03).map((arc) => {
              const LABEL_W = 90;
              const isRight = arc.sinA > 0.15;
              const isLeft = arc.sinA < -0.15;
              const posStyle = isRight
                ? { left: arc.nameX, alignItems: 'flex-start' as const }
                : isLeft
                  ? { right: CHART_SIZE - arc.nameX, alignItems: 'flex-end' as const }
                  : { left: arc.nameX - LABEL_W / 2, alignItems: 'center' as const };
              const textAlign: 'left' | 'right' | 'center' = isRight ? 'left' : isLeft ? 'right' : 'center';
              return (
                <View
                  key={`name-${arc.categoryId}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: arc.nameY - 7,
                    width: LABEL_W,
                    ...posStyle,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-foreground"
                    style={{
                      fontFamily: 'IBMPlexSansThai_600SemiBold',
                      fontSize: 10,
                      textAlign,
                      width: LABEL_W,
                    }}
                  >
                    {arc.name}
                  </Text>
                </View>
              );
            })}

            {/* Center text overlay */}
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {viewType === 'all' && netAmount !== undefined ? (() => {
                const isNeg = netAmount < 0;
                const sign = isNeg ? '-' : '+';
                const netColor = isNeg ? '#C65A4E' : '#3E8B68';
                return (
                  <>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">คงเหลือ</Text>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, fontVariant: ['tabular-nums'], letterSpacing: -0.5, color: netColor }}>
                      {sign}{formatCurrency(Math.abs(netAmount))}
                    </Text>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 2, color: netColor }}>บาท</Text>
                  </>
                );
              })() : (
                <>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">ยอดรวม</Text>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, fontVariant: ['tabular-nums'], letterSpacing: -0.5 }} className="text-foreground">
                    {formatCurrency(total)}
                  </Text>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 2 }} className="text-muted-foreground">บาท</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Action buttons — รายการทั้งหมด + เทียบรายจ่าย */}
        <View style={{ flexDirection: 'row', gap: 24, marginTop: 28, justifyContent: 'center' }}>
          <Pressable
            onPress={() => {
              if (period) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAllModal(true);
              }
            }}
            className="bg-primary rounded-full border border-border px-2 py-1"
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 16,
              gap: 6,
              shadowColor: '#E87A3D',
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            })}
          >
            <View className="flex-row items-center gap-1">
              <Ionicons name="list-circle-outline" size={18} color="#fff" />
              <Text className="text-primary-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}>
                รายการทั้งหมด
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCompareModal(true);
            }}
            className="bg-primary rounded-full border border-border px-2 py-1"
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 16,
              gap: 6,
              shadowColor: '#E87A3D',
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            })}
          >
            <View className="flex-row items-center gap-1">
              <Ionicons name="swap-horizontal" size={18} color="#fff" />
              <Text className="text-primary-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}>
                เทียบรายจ่าย
              </Text>
            </View>

          </Pressable>
        </View>
      </View>

      {/* Breakdown list card */}
      <View className="bg-card mx-4" style={{
        paddingVertical: 4, borderRadius: 24,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 2, overflow: 'hidden',
      }}>
        {filtered.map((item, i) => {
          const color = item.category?.color ?? '#D3CBC3';
          return (
            <Pressable
              key={item.categoryId}
              onPress={() => {
                if (period && item.category) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(item.category);
                }
              }}
              className={i < filtered.length - 1 ? 'border-b border-border' : ''}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 14, paddingHorizontal: 16,
              }}
            >
              <CatCategoryIcon
                kind={item.category?.icon ?? 'help-circle'}
                size={44}
                bg={color + '20'}
                strokeColor={color}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {viewType === 'all' && item.category && (
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 6,
                        backgroundColor: item.category.type === 'income' ? '#E3F1EA' : '#FBE5E1',
                        borderWidth: 1,
                        borderColor: item.category.type === 'income' ? '#3E8B68' : '#C65A4E',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'IBMPlexSansThai_700Bold',
                          fontSize: 10,
                          color: item.category.type === 'income' ? '#3E8B68' : '#C65A4E',
                          lineHeight: 14,
                        }}
                      >
                        {item.category.type === 'income' ? 'รับ' : 'จ่าย'}
                      </Text>
                    </View>
                  )}
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, flexShrink: 1 }}
                    className="text-foreground"
                  >
                    {item.category?.name ?? 'อื่น ๆ'}
                  </Text>
                </View>
                {/* Progress bar */}
                <View className="bg-secondary" style={{ height: 4, borderRadius: 999, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(item.percentage, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, fontVariant: ['tabular-nums'] }} className="text-foreground">{formatCurrency(item.total)}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'], marginTop: 2 }} className="text-muted-foreground">{item.percentage.toFixed(1)}%</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#A39685" style={{ marginLeft: 2 }} />
            </Pressable>
          );
        })}
      </View>

      {/* Calendar Modal */}
      {period && selectedCategory && (
        <CategoryCalendarModal
          visible={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory}
          period={period}
          walletId={walletId}
          viewType={viewType}
        />
      )}

      {/* All Transactions Calendar Modal */}
      {period && (
        <AllTransactionsCalendarModal
          visible={showAllModal}
          onClose={() => setShowAllModal(false)}
          period={period}
          walletId={walletId}
          viewType={viewType}
        />
      )}

      {/* Compare Expenses Modal */}
      <CompareExpensesModal
        visible={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        walletId={walletId}
      />
    </View>
  );
}
