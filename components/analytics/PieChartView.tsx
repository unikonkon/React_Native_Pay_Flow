import { formatCurrency } from '@/lib/utils/format';
import type { CategorySummary } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface PieChartViewProps {
  data: CategorySummary[];
  title: string;
  minPercentage?: number;
}

const CHART_SIZE = 220;
const STROKE_WIDTH = 38;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PieChartView({ data, title, minPercentage = 0 }: PieChartViewProps) {
  if (data.length === 0) {
    return (
      <View className="items-center py-10">
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground">ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  // Build donut segments
  const segments: { color: string; fraction: number }[] = data.slice(0, 8).map((item) => ({
    color: item.category?.color ?? '#D3CBC3',
    fraction: total > 0 ? item.total / total : 0,
  }));

  // Calculate stroke offsets for each segment
  let accumulated = 0;
  const arcs = segments.map((seg) => {
    const offset = accumulated;
    accumulated += seg.fraction;
    return {
      color: seg.color,
      strokeDasharray: `${seg.fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      strokeDashoffset: -offset * CIRCUMFERENCE,
    };
  });

  return (
    <View className="mb-4">
      {/* Donut card */}
      <View className="bg-card mx-4 mb-4" style={{
        padding: 20, paddingHorizontal: 16, paddingBottom: 24, borderRadius: 24,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: CHART_SIZE, height: CHART_SIZE, position: 'relative' }}>
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
            {/* Center text overlay */}
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">ยอดรวม</Text>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 28, fontVariant: ['tabular-nums'], letterSpacing: -0.5 }} className="text-foreground">
                {formatCurrency(total)}
              </Text>
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 2 }} className="text-muted-foreground">บาท</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Breakdown list card */}
      <View className="bg-card mx-4" style={{
        paddingVertical: 4, borderRadius: 24,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 2, overflow: 'hidden',
      }}>
        {data.filter(item => item.percentage >= minPercentage).map((item, i, arr) => {
          const color = item.category?.color ?? '#D3CBC3';
          return (
            <View
              key={item.categoryId}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 14, paddingHorizontal: 16,
                borderBottomWidth: i < arr.length - 1 ? 0.5 : 0,
                borderBottomColor: 'rgba(42,35,32,0.08)',
              }}
            >
              <View
                className="rounded-full items-center justify-center"
                style={{ width: 44, height: 44, backgroundColor: color + '20' }}
              >
                <Ionicons
                  name={(item.category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, marginBottom: 6 }} className="text-foreground">{item.category?.name ?? 'อื่น ๆ'}</Text>
                {/* Progress bar */}
                <View style={{ height: 4, backgroundColor: '#F5EEE0', borderRadius: 999, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(item.percentage, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, fontVariant: ['tabular-nums'] }} className="text-foreground">{formatCurrency(item.total)}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'], marginTop: 2 }} className="text-muted-foreground">{item.percentage.toFixed(1)}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
