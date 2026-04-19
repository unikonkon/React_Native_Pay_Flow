import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import type { CategorySummary } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface PieChartViewProps {
  data: CategorySummary[];
  title: string;
}

const screenWidth = Dimensions.get('window').width;

export function PieChartView({ data, title }: PieChartViewProps) {
  if (data.length === 0) {
    return (
      <View className="items-center py-10">
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground">ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  const chartData = data.slice(0, 8).map((item) => ({
    name: item.category?.name ?? 'อื่น ๆ',
    amount: item.total,
    color: item.category?.color ?? '#D3CBC3',
    legendFontColor: '#666',
    legendFontSize: 12,
  }));

  return (
    <View className="mb-4">
      {/* Donut card */}
      <View className="bg-card mx-4 mb-4" style={{
        padding: 20, paddingHorizontal: 16, paddingBottom: 24, borderRadius: 24,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}>
        <View style={{ position: 'relative', alignItems: 'center' }}>
          <PieChart
            data={chartData}
            width={220}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="55"
            hasLegend={false}
            absolute
          />
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

      {/* Breakdown list card */}
      <View className="bg-card mx-4" style={{
        padding: 4, paddingVertical: 0, borderRadius: 24,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 2, overflow: 'hidden',
      }}>
        {data.map((item, i) => (
          <View
            key={item.categoryId}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingVertical: 12, paddingHorizontal: 16,
              borderBottomWidth: i < data.length - 1 ? 0.5 : 0,
              borderBottomColor: 'rgba(42,35,32,0.08)',
            }}
          >
            <View
              className="rounded-full items-center justify-center"
              style={{ width: 38, height: 38, backgroundColor: item.category?.color ?? '#D3CBC3' }}
            >
              <Ionicons
                name={(item.category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                size={16}
                color="white"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, marginBottom: 5 }} className="text-foreground">{item.category?.name ?? 'อื่น ๆ'}</Text>
              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: '#F5EEE0', borderRadius: 999, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(item.percentage, 100)}%`, height: '100%', backgroundColor: item.category?.color ?? '#D3CBC3', borderRadius: 999 }} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, fontVariant: ['tabular-nums'] }} className="text-foreground">{formatCurrency(item.total)}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">{item.percentage.toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
